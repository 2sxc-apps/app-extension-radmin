/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ var __webpack_modules__ = ({

/***/ "./src/ts/customizers.ts":
/*!*******************************!*\
  !*** ./src/ts/customizers.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   customizers: () => (/* binding */ customizers)\n/* harmony export */ });\n/* harmony import */ var _customizers_customize_resources_title_example__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./customizers/customize-resources-title-example */ \"./src/ts/customizers/customize-resources-title-example.ts\");\n/* harmony import */ var _customizers_customize_resource_complexity_example__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./customizers/customize-resource-complexity-example */ \"./src/ts/customizers/customize-resource-complexity-example.ts\");\n\n\n// Log on module evaluation\nconsole.log(\"Loading radmin customizers module...\");\n// Clear named export\nconst customizers = [\n    _customizers_customize_resources_title_example__WEBPACK_IMPORTED_MODULE_0__.CustomizeAccessCodesTable,\n    _customizers_customize_resource_complexity_example__WEBPACK_IMPORTED_MODULE_1__.CustomizeResourcesTable,\n    // add more customizer constructors here as needed\n];\n// No default export - stick to named exports for ES modules\n// Log after export\nconsole.log(\"radmin customizers version 0.5.0\");\nconsole.log(\"Exported customizers array with length:\", customizers.length);\n\n\n//# sourceURL=webpack://2sxc-extension-radmin-customizers/./src/ts/customizers.ts?\n}");

/***/ }),

/***/ "./src/ts/customizers/customize-resource-complexity-example.ts":
/*!*********************************************************************!*\
  !*** ./src/ts/customizers/customize-resource-complexity-example.ts ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   CustomizeResourcesTable: () => (/* binding */ CustomizeResourcesTable)\n/* harmony export */ });\n// Example: renders a 1-10 complexity value as stars.\n// To create your own: copy this file, set targetKey, implement the three methods, register in customizers.ts.\nclass CustomizeResourcesTable {\n    targetKey = \"resources\";\n    // Return true to activate this customizer for the given table, false to skip it\n    shouldApply(config) {\n        const normalizedType = (config.viewId ?? \"\").toLowerCase();\n        return normalizedType === this.targetKey;\n    }\n    // Modify the Radmin table config (title, column definitions, etc.) - return it unchanged if not needed\n    customizeConfig(config) {\n        return config;\n    }\n    // Modify the Tabulator options object - see https://tabulator.info/docs/6.3/options\n    customizeTabulator(options) {\n        const getValueIgnoreCase = (row, key) => {\n            const matchedKey = Object.keys(row).find((k) => k.toLowerCase() === key);\n            return matchedKey ? row[matchedKey] : undefined;\n        };\n        const findColumn = (columns) => {\n            for (const column of columns) {\n                const field = (column?.field ?? \"\").toLowerCase();\n                if (field === \"complexity\" || field === \"id\") {\n                    return column;\n                }\n                if (Array.isArray(column?.columns)) {\n                    const nested = findColumn(column.columns);\n                    if (nested) {\n                        return nested;\n                    }\n                }\n            }\n            return undefined;\n        };\n        if (options.columns) {\n            // Prefer a dedicated complexity column; fallback to id if complexity is stored there.\n            const complexityCol = findColumn(options.columns);\n            if (complexityCol) {\n                complexityCol.formatter = (cell) => {\n                    const rowData = cell.getRow().getData();\n                    const rawValue = getValueIgnoreCase(rowData, \"complexity\");\n                    const value = Number(rawValue);\n                    if (!Number.isFinite(value)) {\n                        return \"\";\n                    }\n                    const score = Math.max(1, Math.min(10, Math.round(value)));\n                    const filledStars = \"★\".repeat(score);\n                    const emptyStars = \"☆\".repeat(10 - score);\n                    return `${filledStars}${emptyStars} ${score}/10`;\n                };\n            }\n        }\n        return options;\n    }\n}\n\n\n//# sourceURL=webpack://2sxc-extension-radmin-customizers/./src/ts/customizers/customize-resource-complexity-example.ts?\n}");

/***/ }),

/***/ "./src/ts/customizers/customize-resources-title-example.ts":
/*!*****************************************************************!*\
  !*** ./src/ts/customizers/customize-resources-title-example.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   CustomizeAccessCodesTable: () => (/* binding */ CustomizeAccessCodesTable)\n/* harmony export */ });\nclass CustomizeAccessCodesTable {\n    // Store the targeted GUID\n    targetGuid = \"ccfefa24-f139-4d27-813b-1e3e3dcc570e\";\n    shouldApply(config) {\n        console.log(\"Checking table:\", config.title, config.dataContentType, config.guid);\n        return config.guid === this.targetGuid;\n    }\n    customizeConfig(config) {\n        return config;\n    }\n    customizeTabulator(options) {\n        // Modify column formatters\n        if (options.columns) {\n            const titleCol = options.columns.find((c) => c.title?.toLowerCase() === \"title\");\n            if (titleCol) {\n                titleCol.formatter = (cell) => {\n                    const value = cell.getValue();\n                    return `<span style=\"color:red\">${value ?? \"\"}</span>`;\n                };\n            }\n        }\n        // Make table fit data width\n        options.layout = \"fitColumns\";\n        return options;\n    }\n}\n\n\n//# sourceURL=webpack://2sxc-extension-radmin-customizers/./src/ts/customizers/customize-resources-title-example.ts?\n}");

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module can't be inlined because the eval devtool is used.
/******/ var __webpack_exports__ = __webpack_require__("./src/ts/customizers.ts");
/******/ const __webpack_exports__customizers = __webpack_exports__.customizers;
/******/ export { __webpack_exports__customizers as customizers };
/******/ 
