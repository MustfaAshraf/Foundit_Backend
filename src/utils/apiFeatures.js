export class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

    // 1. Filtering (e.g. ?type=LOST&category=Pets)
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'dateRange', 'keyword'];
        excludedFields.forEach(el => delete queryObj[el]);

        // 1.1 Handle Basic & Advanced filtering (gte, gt, lte, lt)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        const finalQuery = JSON.parse(queryStr);

        // 1.2 Make string filters case-insensitive (like category)
        Object.keys(finalQuery).forEach(key => {
            if (typeof finalQuery[key] === 'string' && key !== 'type') { 
                // We use regex to make it case-insensitive
                finalQuery[key] = { $regex: new RegExp(`^${finalQuery[key]}$`, 'i') };
            }
        });

        this.mongooseQuery = this.mongooseQuery.find(finalQuery);

        // 1.2 Handle dateRange filtering specifically (today, week, month)
        if (this.queryString.dateRange) {
            const date = new Date();
            if (this.queryString.dateRange === 'today') {
                date.setHours(date.getHours() - 24); // Last 24 hours
                this.mongooseQuery = this.mongooseQuery.find({ createdAt: { $gte: date } });
            } else if (this.queryString.dateRange === 'week') {
                date.setDate(date.getDate() - 7); // Last 7 days
                this.mongooseQuery = this.mongooseQuery.find({ createdAt: { $gte: date } });
            } else if (this.queryString.dateRange === 'month') {
                date.setMonth(date.getMonth() - 1); // Last 30 days
                this.mongooseQuery = this.mongooseQuery.find({ createdAt: { $gte: date } });
            }
        }

        return this;
    }

    // 2. Sorting (e.g. ?sort=-createdAt)
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        } else {
            // Default: Newest first
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
        }
        return this;
    }

    // 3. Field Limiting (e.g. ?fields=title,image)
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        } else {
            this.mongooseQuery = this.mongooseQuery.select('-__v'); // Exclude mongoose version
        }
        return this;
    }

    // 4. Pagination (e.g. ?page=2&limit=10)
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 9;
        const skip = (page - 1) * limit;

        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
        return this;
    }

    // 5. Search (e.g. ?keyword=laptop)
    search() {
        if (this.queryString.keyword) {
            const queryStr = this.queryString.keyword;
            
            this.mongooseQuery = this.mongooseQuery.find({
                $or: [
                    { title: { $regex: queryStr, $options: 'i' } },
                    { description: { $regex: queryStr, $options: 'i' } },
                    { category: { $regex: queryStr, $options: 'i' } },
                    { subCategory: { $regex: queryStr, $options: 'i' } },
                    { brand: { $regex: queryStr, $options: 'i' } },
                    { locationName: { $regex: queryStr, $options: 'i' } },
                    { tags: { $in: [new RegExp(queryStr, 'i')] } } 
                ]
            });
        }
        return this;
    }
}