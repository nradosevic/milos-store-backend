export declare class Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    iconName: string;
    depth: number;
    sortOrder: number;
    isActive: boolean;
    parent: Category;
    parentId: number | null;
    children: Category[];
    products: any[];
    createdAt: Date;
    updatedAt: Date;
}
