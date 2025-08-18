export default {
    testEnvironment: "node",
    extensionsToTreatAsEsm: [], // Empty to avoid validation error
    moduleFileExtensions: ["js", "mjs"],
    transform: {}, // No transformation needed for ESM
    transformIgnorePatterns: [], // Allow node_modules to be processed as ESM
};
