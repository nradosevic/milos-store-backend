export declare class CreateProductDto {
    title: string;
    slug?: string;
    description: string;
    shortDescription?: string;
    price?: number;
    priceOnRequest?: boolean;
    year?: number;
    condition?: string;
    origin?: string;
    dimensions?: string;
    material?: string;
    author?: string;
    publisher?: string;
    period?: string;
    hiddenFields?: string[];
    customFields?: Record<string, string>;
    isUnique?: boolean;
    stock?: number;
    isFeatured?: boolean;
    isActive?: boolean;
    isSold?: boolean;
    sortOrder?: number;
    categoryId?: number;
    tags?: string[];
}
