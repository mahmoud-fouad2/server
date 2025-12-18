import asyncHandler from 'express-async-handler';
import adminAnalyticsService from '../services/admin-analytics.service.js';

export const getOverview = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getOverview(dateFrom, dateTo);
  res.json(result);
});

export const getSessionsByCountry = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getSessionsByCountry(dateFrom, dateTo);
  res.json(result);
});

export const getTopIps = asyncHandler(async (req, res) => {
  const { from, to, skip = 0, take = 50 } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getTopIps(dateFrom, dateTo, parseInt(skip), parseInt(take));
  res.json(result);
});

export const getBrowserDeviceBreakdown = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getBrowserDeviceBreakdown(dateFrom, dateTo);
  res.json(result);
});

export const getReferrers = asyncHandler(async (req, res) => {
  const { from, to, take = 50 } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getReferrers(dateFrom, dateTo, parseInt(take));
  res.json(result);
});

export default {
  getOverview,
  getSessionsByCountry,
  getTopIps,
  getBrowserDeviceBreakdown,
  getReferrers
};
