const asyncHandler = require('express-async-handler');
const adminAnalyticsService = require('../services/admin-analytics.service');

exports.getOverview = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getOverview(dateFrom, dateTo);
  res.json(result);
});

exports.getSessionsByCountry = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getSessionsByCountry(dateFrom, dateTo);
  res.json(result);
});

exports.getTopIps = asyncHandler(async (req, res) => {
  const { from, to, skip = 0, take = 50 } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getTopIps(dateFrom, dateTo, parseInt(skip), parseInt(take));
  res.json(result);
});

exports.getBrowserDeviceBreakdown = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getBrowserDeviceBreakdown(dateFrom, dateTo);
  res.json(result);
});

exports.getReferrers = asyncHandler(async (req, res) => {
  const { from, to, take = 50 } = req.query;
  const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = to ? new Date(to) : new Date();

  const result = await adminAnalyticsService.getReferrers(dateFrom, dateTo, parseInt(take));
  res.json(result);
});
