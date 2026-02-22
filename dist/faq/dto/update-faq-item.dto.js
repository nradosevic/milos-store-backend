"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFaqItemDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_faq_item_dto_1 = require("./create-faq-item.dto");
class UpdateFaqItemDto extends (0, mapped_types_1.PartialType)(create_faq_item_dto_1.CreateFaqItemDto) {
}
exports.UpdateFaqItemDto = UpdateFaqItemDto;
//# sourceMappingURL=update-faq-item.dto.js.map