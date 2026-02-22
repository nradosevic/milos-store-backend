export declare class QueryProductsDto {
    search?: string;
    categorySlug?: string;
    tags?: string;
    yearMin?: number;
    yearMax?: number;
    condition?: string;
    priceMin?: number;
    priceMax?: number;
    isUnique?: boolean;
    isSold?: boolean;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    limit?: number;
}
