class SearchService {
    constructor() {
        this.searchableFields = {
            report: ['title', 'description', 'reportNumber', 'location.address'],
            user: ['username', 'email', 'profile.firstName', 'profile.lastName'],
            tenant: ['name', 'code', 'city']
        };
    }

    async search(model, query, filters = {}, options = {}) {
        const {
            page = 1,
            limit = 20,
            sort = '-createdAt',
            populate = ''
        } = options;

        const searchQuery = this.buildSearchQuery(model, query, filters);
        
        const results = await model.find(searchQuery)
            .populate(populate)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await model.countDocuments(searchQuery);

        return {
            results,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    buildSearchQuery(model, query, filters) {
        const searchQuery = { ...filters };

        if (query) {
            const modelName = model.modelName.toLowerCase();
            const fields = this.searchableFields[modelName] || [];
            
            if (fields.length > 0) {
                searchQuery.$or = fields.map(field => ({
                    [field]: { $regex: query, $options: 'i' }
                }));
            }
        }

        return searchQuery;
    }

    async searchAcrossModels(query, tenantId) {
        const Report = require('../models/Report');
        const User = require('../models/User');
        
        const results = {
            reports: [],
            users: []
        };

        const reportQuery = {
            tenant: tenantId,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { reportNumber: { $regex: query, $options: 'i' } }
            ]
        };

        results.reports = await Report.find(reportQuery)
            .limit(10)
            .select('title reportNumber status type');

        const userQuery = {
            tenant: tenantId,
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        };

        results.users = await User.find(userQuery)
            .limit(10)
            .select('username email role profile.avatar');

        return results;
    }

    async getSuggestions(field, value, model, filters = {}) {
        const pipeline = [
            { $match: filters },
            { $group: { _id: `$${field}` } },
            { $match: { _id: { $regex: value, $options: 'i' } } },
            { $limit: 10 }
        ];

        const suggestions = await model.aggregate(pipeline);
        return suggestions.map(s => s._id);
    }
}

module.exports = new SearchService();