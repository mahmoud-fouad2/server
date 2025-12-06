const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AgentHandoffService = require('../services/agent-handoff.service');

/**
 * @route POST /api/handoff/evaluate
 * @desc Evaluate if conversation needs handoff
 * @access Private
 */
router.post('/evaluate', authenticateToken, async (req, res) => {
  try {
    const { conversation, sentiment } = req.body;

    if (!conversation) {
      return res.status(400).json({
        success: false,
        message: 'Conversation data is required'
      });
    }

    const evaluation = AgentHandoffService.evaluateHandoff(conversation, sentiment || {});
    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Evaluate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate handoff',
      error: error.message
    });
  }
});

/**
 * @route POST /api/handoff/initiate
 * @desc Initiate handoff process
 * @access Private
 */
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { conversationId, evaluation, conversation } = req.body;

    if (!conversationId || !evaluation || !conversation) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID, evaluation, and conversation data are required'
      });
    }

    const result = await AgentHandoffService.initiateHandoff(conversationId, evaluation, conversation);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Initiate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate handoff',
      error: error.message
    });
  }
});

/**
 * @route POST /api/handoff/complete
 * @desc Complete handoff and collect feedback
 * @access Private
 */
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { handoffId, feedback } = req.body;

    if (!handoffId) {
      return res.status(400).json({
        success: false,
        message: 'Handoff ID is required'
      });
    }

    AgentHandoffService.completeHandoff(handoffId, feedback);
    res.json({
      success: true,
      message: 'Handoff completed successfully'
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete handoff',
      error: error.message
    });
  }
});

/**
 * @route GET /api/handoff/status/:handoffId
 * @desc Get handoff status
 * @access Private
 */
router.get('/status/:handoffId', authenticateToken, async (req, res) => {
  try {
    const { handoffId } = req.params;
    const handoff = AgentHandoffService.getHandoff(handoffId);

    if (!handoff) {
      return res.status(404).json({
        success: false,
        message: 'Handoff not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: handoff.id,
        status: handoff.status,
        agentId: handoff.agentId,
        startedAt: handoff.startedAt,
        priority: handoff.priority,
        reason: handoff.reason
      }
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get handoff status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/handoff/queue
 * @desc Get queued handoffs
 * @access Private (Business Owner/Admin)
 */
router.get('/queue', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const queue = Array.from(AgentHandoffService.handoffQueue.values())
      .filter(item => item.conversation.businessId === businessId);

    res.json({
      success: true,
      data: {
        count: queue.length,
        queue: queue.map(item => ({
          conversationId: item.conversationId,
          priority: item.priority,
          reason: item.evaluation.reason,
          queuedAt: item.queuedAt
        }))
      }
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get handoff queue',
      error: error.message
    });
  }
});

/**
 * @route GET /api/handoff/active
 * @desc Get active handoffs
 * @access Private (Business Owner/Admin)
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const active = Array.from(AgentHandoffService.activeHandoffs.values())
      .filter(handoff => handoff.conversation.businessId === businessId);

    res.json({
      success: true,
      data: {
        count: active.length,
        handoffs: active.map(handoff => ({
          id: handoff.id,
          conversationId: handoff.conversationId,
          agentId: handoff.agentId,
          status: handoff.status,
          priority: handoff.priority,
          reason: handoff.reason,
          startedAt: handoff.startedAt
        }))
      }
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Active error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active handoffs',
      error: error.message
    });
  }
});

/**
 * @route POST /api/handoff/agent/add
 * @desc Add agent to pool
 * @access Private (Business Owner/Admin)
 */
router.post('/agent/add', authenticateToken, async (req, res) => {
  try {
    const { agentId, name, skills, priority } = req.body;

    if (!agentId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID and name are required'
      });
    }

    const agent = {
      id: agentId,
      name,
      skills: skills || [],
      priority: priority || 'medium',
      businessId: req.business?.id
    };

    AgentHandoffService.addAgent(agent);
    res.json({
      success: true,
      message: 'Agent added to pool successfully'
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Add agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add agent',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/handoff/agent/:agentId
 * @desc Remove agent from pool
 * @access Private (Business Owner/Admin)
 */
router.delete('/agent/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    AgentHandoffService.removeAgent(agentId);

    res.json({
      success: true,
      message: 'Agent removed from pool successfully'
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Remove agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove agent',
      error: error.message
    });
  }
});

/**
 * @route GET /api/handoff/agent/status
 * @desc Get agent pool status
 * @access Private (Business Owner/Admin)
 */
router.get('/agent/status', authenticateToken, async (req, res) => {
  try {
    const status = AgentHandoffService.getAgentPoolStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Agent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agent status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/handoff/statistics
 * @desc Get handoff statistics
 * @access Private (Business Owner/Admin)
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const stats = AgentHandoffService.getHandoffStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get handoff statistics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/handoff/cancel/:handoffId
 * @desc Cancel handoff
 * @access Private (Business Owner/Admin)
 */
router.post('/cancel/:handoffId', authenticateToken, async (req, res) => {
  try {
    const { handoffId } = req.params;
    AgentHandoffService.cancelHandoff(handoffId);

    res.json({
      success: true,
      message: 'Handoff cancelled successfully'
    });
  } catch (error) {
    console.error('[Agent Handoff Routes] Cancel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel handoff',
      error: error.message
    });
  }
});

module.exports = router;
