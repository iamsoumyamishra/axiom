"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipType = exports.ResourceStatus = void 0;
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["PENDING"] = "PENDING";
    ResourceStatus["PROCESSING"] = "PROCESSING";
    ResourceStatus["COMPLETED"] = "COMPLETED";
    ResourceStatus["FAILED"] = "FAILED";
    ResourceStatus["DUPLICATE"] = "DUPLICATE";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["SIMILAR"] = "similar";
    RelationshipType["REFERENCES"] = "references";
    RelationshipType["CONTRADICTS"] = "contradicts";
    RelationshipType["CONTINUES"] = "continues";
    RelationshipType["PREREQUISITE"] = "prerequisite";
    RelationshipType["ALTERNATIVE"] = "alternative";
    RelationshipType["SAME_TOPIC"] = "same_topic";
    RelationshipType["SAME_AUTHOR"] = "same_author";
    RelationshipType["SAME_PROJECT"] = "same_project";
    RelationshipType["DUPLICATE"] = "duplicate";
    RelationshipType["VERSION_UPDATE"] = "version_update";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
//# sourceMappingURL=resource.types.js.map