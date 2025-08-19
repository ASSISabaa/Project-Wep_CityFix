// server/routes/impact.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');

// ==================== Get User Statistics ====================
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get all user reports
        const reports = await Report.find({ userId: userId });
        
        // Calculate statistics
        const totalReports = reports.length;
        const resolvedIssues = reports.filter(r => r.status === 'resolved').length;
        const inProgressIssues = reports.filter(r => r.status === 'in-progress').length;
        const pendingIssues = reports.filter(r => r.status === 'pending').length;
        
        // Calculate community impact (example: each report helps ~50 people)
        const communityImpact = totalReports * 50 + resolvedIssues * 100;
        
        // Calculate user rating based on activity
        let rating = 0;
        if (totalReports > 0) {
            const resolutionRate = (resolvedIssues / totalReports) * 100;
            if (resolutionRate >= 80) rating = 5.0;
            else if (resolutionRate >= 60) rating = 4.5;
            else if (resolutionRate >= 40) rating = 4.0;
            else if (resolutionRate >= 20) rating = 3.5;
            else rating = 3.0;
            
            // Bonus for activity
            if (totalReports >= 50) rating = Math.min(5.0, rating + 0.5);
            else if (totalReports >= 20) rating = Math.min(5.0, rating + 0.3);
            else if (totalReports >= 10) rating = Math.min(5.0, rating + 0.1);
        }
        
        // Get weekly count
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyReports = await Report.countDocuments({
            userId: userId,
            createdAt: { $gte: oneWeekAgo }
        });
        
        // Format response
        const stats = {
            totalReports,
            resolvedIssues,
            inProgressIssues,
            pendingIssues,
            communityImpact,
            rating: parseFloat(rating.toFixed(1)),
            totalReports_description: `+${weeklyReports} this week`,
            resolvedIssues_description: totalReports > 0 ? `${Math.round((resolvedIssues/totalReports)*100)}% resolution rate` : 'No reports yet',
            communityImpact_description: 'People helped',
            rating_description: 'Community rating'
        };
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

// ==================== Get User Activities ====================
router.get('/activities', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;
        
        // Get user reports with pagination
        const activities = await Report.find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();
        
        // Format activities for frontend
        const formattedActivities = activities.map(activity => ({
            id: activity._id,
            title: activity.title || `${activity.issueType} Report`,
            type: activity.issueType,
            location: activity.location,
            address: activity.address || activity.location,
            lat: activity.coordinates?.lat,
            lng: activity.coordinates?.lng,
            status: activity.status,
            timestamp: activity.createdAt,
            description: activity.description,
            images: activity.images || [],
            priority: activity.priority || 'medium',
            upvotes: activity.upvotes || 0,
            comments: activity.comments?.length || 0
        }));
        
        res.json({
            success: true,
            activities: formattedActivities,
            total: await Report.countDocuments({ userId: userId })
        });
        
    } catch (error) {
        console.error('Error fetching user activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities',
            error: error.message
        });
    }
});

// ==================== Get User Badges ====================
router.get('/badges', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get user reports for badge calculation
        const reports = await Report.find({ userId: userId });
        const totalReports = reports.length;
        const resolvedIssues = reports.filter(r => r.status === 'resolved').length;
        const communityImpact = totalReports * 50 + resolvedIssues * 100;
        
        // Get user account age
        const user = await User.findById(userId);
        const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)); // days
        
        // Define badges with dynamic progress
        const badges = [
            {
                id: 'first-report',
                type: 'first-report',
                title: 'First Reporter',
                description: 'Submit your first report to the community',
                icon: '🏅',
                earned: totalReports > 0,
                earnedDate: totalReports > 0 ? reports[0].createdAt.toLocaleDateString() : null,
                progress: totalReports > 0 ? 100 : 0,
                progressText: totalReports > 0 ? 'Completed!' : 'Submit your first report'
            },
            {
                id: 'active-citizen',
                type: 'active-citizen',
                title: 'Active Citizen',
                description: 'Submit 5 reports',
                icon: '⭐',
                earned: totalReports >= 5,
                earnedDate: totalReports >= 5 ? 'Earned' : null,
                progress: Math.min(100, (totalReports / 5) * 100),
                progressText: `${totalReports}/5 reports`
            },
            {
                id: 'problem-solver',
                type: 'resolved-issues',
                title: 'Problem Solver',
                description: 'Get 10 issues resolved',
                icon: '🎖️',
                earned: resolvedIssues >= 10,
                earnedDate: resolvedIssues >= 10 ? 'Earned' : null,
                progress: Math.min(100, (resolvedIssues / 10) * 100),
                progressText: `${resolvedIssues}/10 resolved`
            },
            {
                id: 'community-hero',
                type: 'community-hero',
                title: 'Community Hero',
                description: 'Help 1000+ residents',
                icon: '🏆',
                earned: communityImpact >= 1000,
                earnedDate: communityImpact >= 1000 ? 'Earned' : null,
                progress: Math.min(100, (communityImpact / 1000) * 100),
                progressText: `${communityImpact}/1000 impact points`
            },
            {
                id: 'top-reporter',
                type: 'top-reporter',
                title: 'Top Reporter',
                description: 'Submit 50 reports',
                icon: '👑',
                earned: totalReports >= 50,
                earnedDate: totalReports >= 50 ? 'Earned' : null,
                progress: Math.min(100, (totalReports / 50) * 100),
                progressText: `${totalReports}/50 reports`
            },
            {
                id: 'veteran',
                type: 'neighborhood-guardian',
                title: 'Neighborhood Guardian',
                description: 'Active for 30+ days',
                icon: '🛡️',
                earned: accountAge >= 30,
                earnedDate: accountAge >= 30 ? 'Earned' : null,
                progress: Math.min(100, (accountAge / 30) * 100),
                progressText: `${accountAge}/30 days`
            },
            {
                id: 'champion',
                type: 'civic-champion',
                title: 'Civic Champion',
                description: 'Submit 100 reports',
                icon: '🥇',
                earned: totalReports >= 100,
                earnedDate: totalReports >= 100 ? 'Earned' : null,
                progress: Math.min(100, (totalReports / 100) * 100),
                progressText: `${totalReports}/100 reports`
            },
            {
                id: 'influencer',
                type: 'problem-solver',
                title: 'Community Influencer',
                description: 'Get 25 issues resolved',
                icon: '🔧',
                earned: resolvedIssues >= 25,
                earnedDate: resolvedIssues >= 25 ? 'Earned' : null,
                progress: Math.min(100, (resolvedIssues / 25) * 100),
                progressText: `${resolvedIssues}/25 resolved`
            }
        ];
        
        // Sort badges: earned first, then by progress
        badges.sort((a, b) => {
            if (a.earned && !b.earned) return -1;
            if (!a.earned && b.earned) return 1;
            return b.progress - a.progress;
        });
        
        res.json({
            success: true,
            badges: badges.slice(0, 8), // Return top 8 badges
            totalBadges: badges.length,
            earnedCount: badges.filter(b => b.earned).length
        });
        
    } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch badges',
            error: error.message
        });
    }
});

// ==================== Get All Reports for Map ====================
router.get('/map-reports', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get filters from query
        const { district, status, type, onlyMine } = req.query;
        
        // Build query
        let query = {};
        if (onlyMine === 'true') {
            query.userId = userId;
        }
        if (district) {
            query.district = district;
        }
        if (status) {
            query.status = status;
        }
        if (type) {
            query.issueType = type;
        }
        
        // Get reports with coordinates
        const reports = await Report.find({
            ...query,
            'coordinates.lat': { $exists: true },
            'coordinates.lng': { $exists: true }
        })
        .sort({ createdAt: -1 })
        .limit(100) // Limit to 100 markers for performance
        .lean();
        
        // Format for map display
        const mapReports = reports.map(report => ({
            id: report._id,
            title: report.title || `${report.issueType} Report`,
            type: report.issueType,
            location: report.location,
            address: report.address || report.location,
            lat: report.coordinates.lat,
            lng: report.coordinates.lng,
            status: report.status,
            timestamp: report.createdAt,
            description: report.description,
            isMyReport: report.userId.toString() === userId.toString(),
            priority: report.priority || 'medium',
            upvotes: report.upvotes || 0
        }));
        
        res.json({
            success: true,
            reports: mapReports,
            total: mapReports.length
        });
        
    } catch (error) {
        console.error('Error fetching map reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch map reports',
            error: error.message
        });
    }
});

// ==================== Get Impact Summary ====================
router.get('/summary', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get time range (default: last 30 days)
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Get reports in time range
        const reports = await Report.find({
            userId: userId,
            createdAt: { $gte: startDate }
        });
        
        // Group by status
        const statusCounts = {
            pending: 0,
            'in-progress': 0,
            resolved: 0
        };
        
        // Group by type
        const typeCounts = {};
        
        // Group by day for chart
        const dailyCounts = {};
        
        reports.forEach(report => {
            // Status count
            statusCounts[report.status]++;
            
            // Type count
            typeCounts[report.issueType] = (typeCounts[report.issueType] || 0) + 1;
            
            // Daily count
            const day = report.createdAt.toISOString().split('T')[0];
            dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        });
        
        // Calculate trends
        const previousPeriodStart = new Date(startDate);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
        
        const previousReports = await Report.countDocuments({
            userId: userId,
            createdAt: { $gte: previousPeriodStart, $lt: startDate }
        });
        
        const currentCount = reports.length;
        const trend = previousReports > 0 
            ? ((currentCount - previousReports) / previousReports * 100).toFixed(1)
            : 100;
        
        res.json({
            success: true,
            summary: {
                period: `Last ${days} days`,
                totalReports: currentCount,
                trend: parseFloat(trend),
                trendDirection: trend >= 0 ? 'up' : 'down',
                statusBreakdown: statusCounts,
                typeBreakdown: typeCounts,
                dailyActivity: dailyCounts,
                averagePerDay: (currentCount / days).toFixed(1),
                resolutionRate: currentCount > 0 
                    ? ((statusCounts.resolved / currentCount) * 100).toFixed(1)
                    : 0
            }
        });
        
    } catch (error) {
        console.error('Error fetching impact summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch impact summary',
            error: error.message
        });
    }
});

// ==================== Get Leaderboard ====================
router.get('/leaderboard', auth, async (req, res) => {
    try {
        // Aggregate user statistics
        const leaderboard = await Report.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalReports: { $sum: 1 },
                    resolvedCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    name: '$user.name',
                    avatar: '$user.avatar',
                    totalReports: 1,
                    resolvedCount: 1,
                    impactScore: {
                        $add: [
                            { $multiply: ['$totalReports', 10] },
                            { $multiply: ['$resolvedCount', 50] }
                        ]
                    }
                }
            },
            {
                $sort: { impactScore: -1 }
            },
            {
                $limit: 10
            }
        ]);
        
        // Add rank and check if current user is in top 10
        const currentUserId = req.user._id.toString();
        let userRank = null;
        
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
            if (entry.userId.toString() === currentUserId) {
                userRank = index + 1;
            }
        });
        
        // If user not in top 10, get their rank
        if (!userRank) {
            const userStats = await Report.aggregate([
                { $match: { userId: req.user._id } },
                {
                    $group: {
                        _id: null,
                        totalReports: { $sum: 1 },
                        resolvedCount: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
                            }
                        }
                    }
                }
            ]);
            
            if (userStats.length > 0) {
                const userScore = (userStats[0].totalReports * 10) + (userStats[0].resolvedCount * 50);
                
                // Count users with higher score
                const higherScoreCount = await Report.aggregate([
                    {
                        $group: {
                            _id: '$userId',
                            score: {
                                $sum: {
                                    $add: [
                                        10,
                                        { $cond: [{ $eq: ['$status', 'resolved'] }, 50, 0] }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        $match: {
                            score: { $gt: userScore }
                        }
                    },
                    {
                        $count: 'count'
                    }
                ]);
                
                userRank = (higherScoreCount[0]?.count || 0) + 1;
            }
        }
        
        res.json({
            success: true,
            leaderboard,
            userRank,
            totalUsers: await User.countDocuments()
        });
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard',
            error: error.message
        });
    }
});

module.exports = router;