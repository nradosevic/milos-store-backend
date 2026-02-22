export declare class BulkImportCategoryItemDto {
    name: string;
    slug?: string;
    description?: string;
    iconName?: string;
    children?: BulkImportCategoryItemDto[];
}
export declare class BulkImportCategoriesDto {
    categories: BulkImportCategoryItemDto[];
}
