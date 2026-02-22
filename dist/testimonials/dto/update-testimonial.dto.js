"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTestimonialDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_testimonial_dto_1 = require("./create-testimonial.dto");
class UpdateTestimonialDto extends (0, mapped_types_1.PartialType)(create_testimonial_dto_1.CreateTestimonialDto) {
}
exports.UpdateTestimonialDto = UpdateTestimonialDto;
//# sourceMappingURL=update-testimonial.dto.js.map