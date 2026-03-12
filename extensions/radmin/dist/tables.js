class CoreFeature {
  constructor(table) {
    this.table = table;
  }
  //////////////////////////////////////////
  /////////////// DataLoad /////////////////
  //////////////////////////////////////////
  reloadData(data, silent, columnsChanged) {
    return this.table.dataLoader.load(data, void 0, void 0, void 0, silent, columnsChanged);
  }
  //////////////////////////////////////////
  ///////////// Localization ///////////////
  //////////////////////////////////////////
  langText() {
    return this.table.modules.localize.getText(...arguments);
  }
  langBind() {
    return this.table.modules.localize.bind(...arguments);
  }
  langLocale() {
    return this.table.modules.localize.getLocale(...arguments);
  }
  //////////////////////////////////////////
  ////////// Inter Table Comms /////////////
  //////////////////////////////////////////
  commsConnections() {
    return this.table.modules.comms.getConnections(...arguments);
  }
  commsSend() {
    return this.table.modules.comms.send(...arguments);
  }
  //////////////////////////////////////////
  //////////////// Layout  /////////////////
  //////////////////////////////////////////
  layoutMode() {
    return this.table.modules.layout.getMode();
  }
  layoutRefresh(force) {
    return this.table.modules.layout.layout(force);
  }
  //////////////////////////////////////////
  /////////////// Event Bus ////////////////
  //////////////////////////////////////////
  subscribe() {
    return this.table.eventBus.subscribe(...arguments);
  }
  unsubscribe() {
    return this.table.eventBus.unsubscribe(...arguments);
  }
  subscribed(key) {
    return this.table.eventBus.subscribed(key);
  }
  subscriptionChange() {
    return this.table.eventBus.subscriptionChange(...arguments);
  }
  dispatch() {
    return this.table.eventBus.dispatch(...arguments);
  }
  chain() {
    return this.table.eventBus.chain(...arguments);
  }
  confirm() {
    return this.table.eventBus.confirm(...arguments);
  }
  dispatchExternal() {
    return this.table.externalEvents.dispatch(...arguments);
  }
  subscribedExternal(key) {
    return this.table.externalEvents.subscribed(key);
  }
  subscriptionChangeExternal() {
    return this.table.externalEvents.subscriptionChange(...arguments);
  }
  //////////////////////////////////////////
  //////////////// Options /////////////////
  //////////////////////////////////////////
  options(key) {
    return this.table.options[key];
  }
  setOption(key, value) {
    if (typeof value !== "undefined") {
      this.table.options[key] = value;
    }
    return this.table.options[key];
  }
  //////////////////////////////////////////
  /////////// Deprecation Checks ///////////
  //////////////////////////////////////////
  deprecationCheck(oldOption, newOption, convert) {
    return this.table.deprecationAdvisor.check(oldOption, newOption, convert);
  }
  deprecationCheckMsg(oldOption, msg) {
    return this.table.deprecationAdvisor.checkMsg(oldOption, msg);
  }
  deprecationMsg(msg) {
    return this.table.deprecationAdvisor.msg(msg);
  }
  //////////////////////////////////////////
  //////////////// Modules /////////////////
  //////////////////////////////////////////
  module(key) {
    return this.table.module(key);
  }
}
class Helpers {
  static elVisible(el) {
    return !(el.offsetWidth <= 0 && el.offsetHeight <= 0);
  }
  static elOffset(el) {
    var box = el.getBoundingClientRect();
    return {
      top: box.top + window.pageYOffset - document.documentElement.clientTop,
      left: box.left + window.pageXOffset - document.documentElement.clientLeft
    };
  }
  static retrieveNestedData(separator, field, data) {
    var structure = separator ? field.split(separator) : [field], length = structure.length, output;
    for (let i = 0; i < length; i++) {
      data = data[structure[i]];
      output = data;
      if (!data) {
        break;
      }
    }
    return output;
  }
  static deepClone(obj, clone2, list = []) {
    var objectProto = {}.__proto__, arrayProto = [].__proto__;
    if (!clone2) {
      clone2 = Object.assign(Array.isArray(obj) ? [] : {}, obj);
    }
    for (var i in obj) {
      let subject = obj[i], match2, copy;
      if (subject != null && typeof subject === "object" && (subject.__proto__ === objectProto || subject.__proto__ === arrayProto)) {
        match2 = list.findIndex((item) => {
          return item.subject === subject;
        });
        if (match2 > -1) {
          clone2[i] = list[match2].copy;
        } else {
          copy = Object.assign(Array.isArray(subject) ? [] : {}, subject);
          list.unshift({ subject, copy });
          clone2[i] = this.deepClone(subject, copy, list);
        }
      }
    }
    return clone2;
  }
}
let Popup$1 = class Popup extends CoreFeature {
  constructor(table, element, parent) {
    super(table);
    this.element = element;
    this.container = this._lookupContainer();
    this.parent = parent;
    this.reversedX = false;
    this.childPopup = null;
    this.blurable = false;
    this.blurCallback = null;
    this.blurEventsBound = false;
    this.renderedCallback = null;
    this.visible = false;
    this.hideable = true;
    this.element.classList.add("tabulator-popup-container");
    this.blurEvent = this.hide.bind(this, false);
    this.escEvent = this._escapeCheck.bind(this);
    this.destroyBinding = this.tableDestroyed.bind(this);
    this.destroyed = false;
  }
  tableDestroyed() {
    this.destroyed = true;
    this.hide(true);
  }
  _lookupContainer() {
    var container = this.table.options.popupContainer;
    if (typeof container === "string") {
      container = document.querySelector(container);
      if (!container) {
        console.warn("Menu Error - no container element found matching selector:", this.table.options.popupContainer, "(defaulting to document body)");
      }
    } else if (container === true) {
      container = this.table.element;
    }
    if (container && !this._checkContainerIsParent(container)) {
      container = false;
      console.warn("Menu Error - container element does not contain this table:", this.table.options.popupContainer, "(defaulting to document body)");
    }
    if (!container) {
      container = document.body;
    }
    return container;
  }
  _checkContainerIsParent(container, element = this.table.element) {
    if (container === element) {
      return true;
    } else {
      return element.parentNode ? this._checkContainerIsParent(container, element.parentNode) : false;
    }
  }
  renderCallback(callback) {
    this.renderedCallback = callback;
  }
  containerEventCoords(e) {
    var touch = !(e instanceof MouseEvent);
    var x = touch ? e.touches[0].pageX : e.pageX;
    var y = touch ? e.touches[0].pageY : e.pageY;
    if (this.container !== document.body) {
      let parentOffset = Helpers.elOffset(this.container);
      x -= parentOffset.left;
      y -= parentOffset.top;
    }
    return { x, y };
  }
  elementPositionCoords(element, position = "right") {
    var offset2 = Helpers.elOffset(element), containerOffset, x, y;
    if (this.container !== document.body) {
      containerOffset = Helpers.elOffset(this.container);
      offset2.left -= containerOffset.left;
      offset2.top -= containerOffset.top;
    }
    switch (position) {
      case "right":
        x = offset2.left + element.offsetWidth;
        y = offset2.top - 1;
        break;
      case "bottom":
        x = offset2.left;
        y = offset2.top + element.offsetHeight;
        break;
      case "left":
        x = offset2.left;
        y = offset2.top - 1;
        break;
      case "top":
        x = offset2.left;
        y = offset2.top;
        break;
      case "center":
        x = offset2.left + element.offsetWidth / 2;
        y = offset2.top + element.offsetHeight / 2;
        break;
    }
    return { x, y, offset: offset2 };
  }
  show(origin, position) {
    var x, y, parentEl, parentOffset, coords;
    if (this.destroyed || this.table.destroyed) {
      return this;
    }
    if (origin instanceof HTMLElement) {
      parentEl = origin;
      coords = this.elementPositionCoords(origin, position);
      parentOffset = coords.offset;
      x = coords.x;
      y = coords.y;
    } else if (typeof origin === "number") {
      parentOffset = { top: 0, left: 0 };
      x = origin;
      y = position;
    } else {
      coords = this.containerEventCoords(origin);
      x = coords.x;
      y = coords.y;
      this.reversedX = false;
    }
    this.element.style.top = y + "px";
    this.element.style.left = x + "px";
    this.container.appendChild(this.element);
    if (typeof this.renderedCallback === "function") {
      this.renderedCallback();
    }
    this._fitToScreen(x, y, parentEl, parentOffset, position);
    this.visible = true;
    this.subscribe("table-destroy", this.destroyBinding);
    this.element.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    return this;
  }
  _fitToScreen(x, y, parentEl, parentOffset, position) {
    var scrollTop = this.container === document.body ? document.documentElement.scrollTop : this.container.scrollTop;
    if (x + this.element.offsetWidth >= this.container.offsetWidth || this.reversedX) {
      this.element.style.left = "";
      if (parentEl) {
        this.element.style.right = this.container.offsetWidth - parentOffset.left + "px";
      } else {
        this.element.style.right = this.container.offsetWidth - x + "px";
      }
      this.reversedX = true;
    }
    let offsetHeight = Math.max(this.container.offsetHeight, scrollTop ? this.container.scrollHeight : 0);
    if (y + this.element.offsetHeight > offsetHeight) {
      if (parentEl) {
        switch (position) {
          case "bottom":
            this.element.style.top = parseInt(this.element.style.top) - this.element.offsetHeight - parentEl.offsetHeight - 1 + "px";
            break;
          default:
            this.element.style.top = parseInt(this.element.style.top) - this.element.offsetHeight + parentEl.offsetHeight + 1 + "px";
        }
      } else {
        this.element.style.height = offsetHeight + "px";
      }
    }
  }
  isVisible() {
    return this.visible;
  }
  hideOnBlur(callback) {
    this.blurable = true;
    if (this.visible) {
      setTimeout(() => {
        if (this.visible) {
          this.table.rowManager.element.addEventListener("scroll", this.blurEvent);
          this.subscribe("cell-editing", this.blurEvent);
          document.body.addEventListener("click", this.blurEvent);
          document.body.addEventListener("contextmenu", this.blurEvent);
          document.body.addEventListener("mousedown", this.blurEvent);
          window.addEventListener("resize", this.blurEvent);
          document.body.addEventListener("keydown", this.escEvent);
          this.blurEventsBound = true;
        }
      }, 100);
      this.blurCallback = callback;
    }
    return this;
  }
  _escapeCheck(e) {
    if (e.keyCode == 27) {
      this.hide();
    }
  }
  blockHide() {
    this.hideable = false;
  }
  restoreHide() {
    this.hideable = true;
  }
  hide(silent = false) {
    if (this.visible && this.hideable) {
      if (this.blurable && this.blurEventsBound) {
        document.body.removeEventListener("keydown", this.escEvent);
        document.body.removeEventListener("click", this.blurEvent);
        document.body.removeEventListener("contextmenu", this.blurEvent);
        document.body.removeEventListener("mousedown", this.blurEvent);
        window.removeEventListener("resize", this.blurEvent);
        this.table.rowManager.element.removeEventListener("scroll", this.blurEvent);
        this.unsubscribe("cell-editing", this.blurEvent);
        this.blurEventsBound = false;
      }
      if (this.childPopup) {
        this.childPopup.hide();
      }
      if (this.parent) {
        this.parent.childPopup = null;
      }
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.visible = false;
      if (this.blurCallback && !silent) {
        this.blurCallback();
      }
      this.unsubscribe("table-destroy", this.destroyBinding);
    }
    return this;
  }
  child(element) {
    if (this.childPopup) {
      this.childPopup.hide();
    }
    this.childPopup = new Popup(this.table, element, this);
    return this.childPopup;
  }
};
class Module extends CoreFeature {
  constructor(table, name) {
    super(table);
    this._handler = null;
  }
  initialize() {
  }
  ///////////////////////////////////
  ////// Options Registration ///////
  ///////////////////////////////////
  registerTableOption(key, value) {
    this.table.optionsList.register(key, value);
  }
  registerColumnOption(key, value) {
    this.table.columnManager.optionsList.register(key, value);
  }
  ///////////////////////////////////
  /// Public Function Registration ///
  ///////////////////////////////////
  registerTableFunction(name, func) {
    if (typeof this.table[name] === "undefined") {
      this.table[name] = (...args) => {
        this.table.initGuard(name);
        return func(...args);
      };
    } else {
      console.warn("Unable to bind table function, name already in use", name);
    }
  }
  registerComponentFunction(component, func, handler) {
    return this.table.componentFunctionBinder.bind(component, func, handler);
  }
  ///////////////////////////////////
  ////////// Data Pipeline //////////
  ///////////////////////////////////
  registerDataHandler(handler, priority) {
    this.table.rowManager.registerDataPipelineHandler(handler, priority);
    this._handler = handler;
  }
  registerDisplayHandler(handler, priority) {
    this.table.rowManager.registerDisplayPipelineHandler(handler, priority);
    this._handler = handler;
  }
  displayRows(adjust) {
    var index = this.table.rowManager.displayRows.length - 1, lookupIndex;
    if (this._handler) {
      lookupIndex = this.table.rowManager.displayPipeline.findIndex((item) => {
        return item.handler === this._handler;
      });
      if (lookupIndex > -1) {
        index = lookupIndex;
      }
    }
    if (adjust) {
      index = index + adjust;
    }
    if (this._handler) {
      if (index > -1) {
        return this.table.rowManager.getDisplayRows(index);
      } else {
        return this.activeRows();
      }
    }
  }
  activeRows() {
    return this.table.rowManager.activeRows;
  }
  refreshData(renderInPosition, handler) {
    if (!handler) {
      handler = this._handler;
    }
    if (handler) {
      this.table.rowManager.refreshActiveData(handler, false, renderInPosition);
    }
  }
  ///////////////////////////////////
  //////// Footer Management ////////
  ///////////////////////////////////
  footerAppend(element) {
    return this.table.footerManager.append(element);
  }
  footerPrepend(element) {
    return this.table.footerManager.prepend(element);
  }
  footerRemove(element) {
    return this.table.footerManager.remove(element);
  }
  ///////////////////////////////////
  //////// Popups Management ////////
  ///////////////////////////////////
  popup(menuEl, menuContainer) {
    return new Popup$1(this.table, menuEl, menuContainer);
  }
  ///////////////////////////////////
  //////// Alert Management ////////
  ///////////////////////////////////
  alert(content, type) {
    return this.table.alertManager.alert(content, type);
  }
  clearAlert() {
    return this.table.alertManager.clear();
  }
}
var defaultConfig = {
  method: "GET"
};
function generateParamsList$1(data, prefix) {
  var output = [];
  prefix = prefix || "";
  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      output = output.concat(generateParamsList$1(item, prefix ? prefix + "[" + i + "]" : i));
    });
  } else if (typeof data === "object") {
    for (var key in data) {
      output = output.concat(generateParamsList$1(data[key], prefix ? prefix + "[" + key + "]" : key));
    }
  } else {
    output.push({ key: prefix, value: data });
  }
  return output;
}
function serializeParams(params) {
  var output = generateParamsList$1(params), encoded = [];
  output.forEach(function(item) {
    encoded.push(encodeURIComponent(item.key) + "=" + encodeURIComponent(item.value));
  });
  return encoded.join("&");
}
function urlBuilder(url, config, params) {
  if (url) {
    if (params && Object.keys(params).length) {
      if (!config.method || config.method.toLowerCase() == "get") {
        config.method = "get";
        url += (url.includes("?") ? "&" : "?") + serializeParams(params);
      }
    }
  }
  return url;
}
function defaultLoaderPromise(url, config, params) {
  var contentType;
  return new Promise((resolve, reject) => {
    url = this.urlGenerator.call(this.table, url, config, params);
    if (config.method.toUpperCase() != "GET") {
      contentType = typeof this.table.options.ajaxContentType === "object" ? this.table.options.ajaxContentType : this.contentTypeFormatters[this.table.options.ajaxContentType];
      if (contentType) {
        for (var key in contentType.headers) {
          if (!config.headers) {
            config.headers = {};
          }
          if (typeof config.headers[key] === "undefined") {
            config.headers[key] = contentType.headers[key];
          }
        }
        config.body = contentType.body.call(this, url, config, params);
      } else {
        console.warn("Ajax Error - Invalid ajaxContentType value:", this.table.options.ajaxContentType);
      }
    }
    if (url) {
      if (typeof config.headers === "undefined") {
        config.headers = {};
      }
      if (typeof config.headers.Accept === "undefined") {
        config.headers.Accept = "application/json";
      }
      if (typeof config.headers["X-Requested-With"] === "undefined") {
        config.headers["X-Requested-With"] = "XMLHttpRequest";
      }
      if (typeof config.mode === "undefined") {
        config.mode = "cors";
      }
      if (config.mode == "cors") {
        if (typeof config.headers["Origin"] === "undefined") {
          config.headers["Origin"] = window.location.origin;
        }
        if (typeof config.credentials === "undefined") {
          config.credentials = "same-origin";
        }
      } else {
        if (typeof config.credentials === "undefined") {
          config.credentials = "include";
        }
      }
      fetch(url, config).then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            resolve(data);
          }).catch((error) => {
            reject(error);
            console.warn("Ajax Load Error - Invalid JSON returned", error);
          });
        } else {
          console.error("Ajax Load Error - Connection Error: " + response.status, response.statusText);
          reject(response);
        }
      }).catch((error) => {
        console.error("Ajax Load Error - Connection Error: ", error);
        reject(error);
      });
    } else {
      console.warn("Ajax Load Error - No URL Set");
      resolve([]);
    }
  });
}
function generateParamsList(data, prefix) {
  var output = [];
  prefix = prefix || "";
  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      output = output.concat(generateParamsList(item, prefix ? prefix + "[" + i + "]" : i));
    });
  } else if (typeof data === "object") {
    for (var key in data) {
      output = output.concat(generateParamsList(data[key], prefix ? prefix + "[" + key + "]" : key));
    }
  } else {
    output.push({ key: prefix, value: data });
  }
  return output;
}
var defaultContentTypeFormatters = {
  "json": {
    headers: {
      "Content-Type": "application/json"
    },
    body: function(url, config, params) {
      return JSON.stringify(params);
    }
  },
  "form": {
    headers: {},
    body: function(url, config, params) {
      var output = generateParamsList(params), form = new FormData();
      output.forEach(function(item) {
        form.append(item.key, item.value);
      });
      return form;
    }
  }
};
class Ajax extends Module {
  static moduleName = "ajax";
  //load defaults
  static defaultConfig = defaultConfig;
  static defaultURLGenerator = urlBuilder;
  static defaultLoaderPromise = defaultLoaderPromise;
  static contentTypeFormatters = defaultContentTypeFormatters;
  constructor(table) {
    super(table);
    this.config = {};
    this.url = "";
    this.urlGenerator = false;
    this.params = false;
    this.loaderPromise = false;
    this.registerTableOption("ajaxURL", false);
    this.registerTableOption("ajaxURLGenerator", false);
    this.registerTableOption("ajaxParams", {});
    this.registerTableOption("ajaxConfig", "get");
    this.registerTableOption("ajaxContentType", "form");
    this.registerTableOption("ajaxRequestFunc", false);
    this.registerTableOption("ajaxRequesting", function() {
    });
    this.registerTableOption("ajaxResponse", false);
    this.contentTypeFormatters = Ajax.contentTypeFormatters;
  }
  //initialize setup options
  initialize() {
    this.loaderPromise = this.table.options.ajaxRequestFunc || Ajax.defaultLoaderPromise;
    this.urlGenerator = this.table.options.ajaxURLGenerator || Ajax.defaultURLGenerator;
    if (this.table.options.ajaxURL) {
      this.setUrl(this.table.options.ajaxURL);
    }
    this.setDefaultConfig(this.table.options.ajaxConfig);
    this.registerTableFunction("getAjaxUrl", this.getUrl.bind(this));
    this.subscribe("data-loading", this.requestDataCheck.bind(this));
    this.subscribe("data-params", this.requestParams.bind(this));
    this.subscribe("data-load", this.requestData.bind(this));
  }
  requestParams(data, config, silent, params) {
    var ajaxParams = this.table.options.ajaxParams;
    if (ajaxParams) {
      if (typeof ajaxParams === "function") {
        ajaxParams = ajaxParams.call(this.table);
      }
      params = Object.assign(Object.assign({}, ajaxParams), params);
    }
    return params;
  }
  requestDataCheck(data, params, config, silent) {
    return !!(!data && this.url || typeof data === "string");
  }
  requestData(url, params, config, silent, previousData) {
    var ajaxConfig;
    if (!previousData && this.requestDataCheck(url)) {
      if (url) {
        this.setUrl(url);
      }
      ajaxConfig = this.generateConfig(config);
      return this.sendRequest(this.url, params, ajaxConfig);
    } else {
      return previousData;
    }
  }
  setDefaultConfig(config = {}) {
    this.config = Object.assign({}, Ajax.defaultConfig);
    if (typeof config == "string") {
      this.config.method = config;
    } else {
      Object.assign(this.config, config);
    }
  }
  //load config object
  generateConfig(config = {}) {
    var ajaxConfig = Object.assign({}, this.config);
    if (typeof config == "string") {
      ajaxConfig.method = config;
    } else {
      Object.assign(ajaxConfig, config);
    }
    return ajaxConfig;
  }
  //set request url
  setUrl(url) {
    this.url = url;
  }
  //get request url
  getUrl() {
    return this.url;
  }
  //send ajax request
  sendRequest(url, params, config) {
    if (this.table.options.ajaxRequesting.call(this.table, url, params) !== false) {
      return this.loaderPromise(url, config, params).then((data) => {
        if (this.table.options.ajaxResponse) {
          data = this.table.options.ajaxResponse.call(this.table, url, params, data);
        }
        return data;
      });
    } else {
      return Promise.reject();
    }
  }
}
class CellComponent {
  constructor(cell) {
    this._cell = cell;
    return new Proxy(this, {
      get: function(target, name, receiver) {
        if (typeof target[name] !== "undefined") {
          return target[name];
        } else {
          return target._cell.table.componentFunctionBinder.handle("cell", target._cell, name);
        }
      }
    });
  }
  getValue() {
    return this._cell.getValue();
  }
  getOldValue() {
    return this._cell.getOldValue();
  }
  getInitialValue() {
    return this._cell.initialValue;
  }
  getElement() {
    return this._cell.getElement();
  }
  getRow() {
    return this._cell.row.getComponent();
  }
  getData(transform) {
    return this._cell.row.getData(transform);
  }
  getType() {
    return "cell";
  }
  getField() {
    return this._cell.column.getField();
  }
  getColumn() {
    return this._cell.column.getComponent();
  }
  setValue(value, mutate) {
    if (typeof mutate == "undefined") {
      mutate = true;
    }
    this._cell.setValue(value, mutate);
  }
  restoreOldValue() {
    this._cell.setValueActual(this._cell.getOldValue());
  }
  restoreInitialValue() {
    this._cell.setValueActual(this._cell.initialValue);
  }
  checkHeight() {
    this._cell.checkHeight();
  }
  getTable() {
    return this._cell.table;
  }
  _getSelf() {
    return this._cell;
  }
}
class Cell extends CoreFeature {
  constructor(column, row) {
    super(column.table);
    this.table = column.table;
    this.column = column;
    this.row = row;
    this.element = null;
    this.value = null;
    this.initialValue;
    this.oldValue = null;
    this.modules = {};
    this.height = null;
    this.width = null;
    this.minWidth = null;
    this.component = null;
    this.loaded = false;
    this.build();
  }
  //////////////// Setup Functions /////////////////
  //generate element
  build() {
    this.generateElement();
    this.setWidth();
    this._configureCell();
    this.setValueActual(this.column.getFieldValue(this.row.data));
    this.initialValue = this.value;
  }
  generateElement() {
    this.element = document.createElement("div");
    this.element.className = "tabulator-cell";
    this.element.setAttribute("role", "gridcell");
    if (this.column.isRowHeader) {
      this.element.classList.add("tabulator-row-header");
    }
  }
  _configureCell() {
    var element = this.element, field = this.column.getField(), vertAligns = {
      top: "flex-start",
      bottom: "flex-end",
      middle: "center"
    }, hozAligns = {
      left: "flex-start",
      right: "flex-end",
      center: "center"
    };
    element.style.textAlign = this.column.hozAlign;
    if (this.column.vertAlign) {
      element.style.display = "inline-flex";
      element.style.alignItems = vertAligns[this.column.vertAlign] || "";
      if (this.column.hozAlign) {
        element.style.justifyContent = hozAligns[this.column.hozAlign] || "";
      }
    }
    if (field) {
      element.setAttribute("tabulator-field", field);
    }
    if (this.column.definition.cssClass) {
      var classNames = this.column.definition.cssClass.split(" ");
      classNames.forEach((className) => {
        element.classList.add(className);
      });
    }
    this.dispatch("cell-init", this);
    if (!this.column.visible) {
      this.hide();
    }
  }
  //generate cell contents
  _generateContents() {
    var val;
    val = this.chain("cell-format", this, null, () => {
      return this.element.innerHTML = this.value;
    });
    switch (typeof val) {
      case "object":
        if (val instanceof Node) {
          while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
          this.element.appendChild(val);
        } else {
          this.element.innerHTML = "";
          if (val != null) {
            console.warn("Format Error - Formatter has returned a type of object, the only valid formatter object return is an instance of Node, the formatter returned:", val);
          }
        }
        break;
      case "undefined":
        this.element.innerHTML = "";
        break;
      default:
        this.element.innerHTML = val;
    }
  }
  cellRendered() {
    this.dispatch("cell-rendered", this);
  }
  //////////////////// Getters ////////////////////
  getElement(containerOnly) {
    if (!this.loaded) {
      this.loaded = true;
      if (!containerOnly) {
        this.layoutElement();
      }
    }
    return this.element;
  }
  getValue() {
    return this.value;
  }
  getOldValue() {
    return this.oldValue;
  }
  //////////////////// Actions ////////////////////
  setValue(value, mutate, force) {
    var changed = this.setValueProcessData(value, mutate, force);
    if (changed) {
      this.dispatch("cell-value-updated", this);
      this.cellRendered();
      if (this.column.definition.cellEdited) {
        this.column.definition.cellEdited.call(this.table, this.getComponent());
      }
      this.dispatchExternal("cellEdited", this.getComponent());
      if (this.subscribedExternal("dataChanged")) {
        this.dispatchExternal("dataChanged", this.table.rowManager.getData());
      }
    }
  }
  setValueProcessData(value, mutate, force) {
    var changed = false;
    if (this.value !== value || force) {
      changed = true;
      if (mutate) {
        value = this.chain("cell-value-changing", [this, value], null, value);
      }
    }
    this.setValueActual(value);
    if (changed) {
      this.dispatch("cell-value-changed", this);
    }
    return changed;
  }
  setValueActual(value) {
    this.oldValue = this.value;
    this.value = value;
    this.dispatch("cell-value-save-before", this);
    this.column.setFieldValue(this.row.data, value);
    this.dispatch("cell-value-save-after", this);
    if (this.loaded) {
      this.layoutElement();
    }
  }
  layoutElement() {
    this._generateContents();
    this.dispatch("cell-layout", this);
  }
  setWidth() {
    this.width = this.column.width;
    this.element.style.width = this.column.widthStyled;
  }
  clearWidth() {
    this.width = "";
    this.element.style.width = "";
  }
  getWidth() {
    return this.width || this.element.offsetWidth;
  }
  setMinWidth() {
    this.minWidth = this.column.minWidth;
    this.element.style.minWidth = this.column.minWidthStyled;
  }
  setMaxWidth() {
    this.maxWidth = this.column.maxWidth;
    this.element.style.maxWidth = this.column.maxWidthStyled;
  }
  checkHeight() {
    this.row.reinitializeHeight();
  }
  clearHeight() {
    this.element.style.height = "";
    this.height = null;
    this.dispatch("cell-height", this, "");
  }
  setHeight() {
    this.height = this.row.height;
    this.element.style.height = this.row.heightStyled;
    this.dispatch("cell-height", this, this.row.heightStyled);
  }
  getHeight() {
    return this.height || this.element.offsetHeight;
  }
  show() {
    this.element.style.display = this.column.vertAlign ? "inline-flex" : "";
  }
  hide() {
    this.element.style.display = "none";
  }
  delete() {
    this.dispatch("cell-delete", this);
    if (!this.table.rowManager.redrawBlock && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = false;
    this.column.deleteCell(this);
    this.row.deleteCell(this);
    this.calcs = {};
  }
  getIndex() {
    return this.row.getCellIndex(this);
  }
  //////////////// Object Generation /////////////////
  getComponent() {
    if (!this.component) {
      this.component = new CellComponent(this);
    }
    return this.component;
  }
}
class ColumnComponent {
  constructor(column) {
    this._column = column;
    this.type = "ColumnComponent";
    return new Proxy(this, {
      get: function(target, name, receiver) {
        if (typeof target[name] !== "undefined") {
          return target[name];
        } else {
          return target._column.table.componentFunctionBinder.handle("column", target._column, name);
        }
      }
    });
  }
  getElement() {
    return this._column.getElement();
  }
  getDefinition() {
    return this._column.getDefinition();
  }
  getField() {
    return this._column.getField();
  }
  getTitleDownload() {
    return this._column.getTitleDownload();
  }
  getCells() {
    var cells = [];
    this._column.cells.forEach(function(cell) {
      cells.push(cell.getComponent());
    });
    return cells;
  }
  isVisible() {
    return this._column.visible;
  }
  show() {
    if (this._column.isGroup) {
      this._column.columns.forEach(function(column) {
        column.show();
      });
    } else {
      this._column.show();
    }
  }
  hide() {
    if (this._column.isGroup) {
      this._column.columns.forEach(function(column) {
        column.hide();
      });
    } else {
      this._column.hide();
    }
  }
  toggle() {
    if (this._column.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  delete() {
    return this._column.delete();
  }
  getSubColumns() {
    var output = [];
    if (this._column.columns.length) {
      this._column.columns.forEach(function(column) {
        output.push(column.getComponent());
      });
    }
    return output;
  }
  getParentColumn() {
    return this._column.getParentComponent();
  }
  _getSelf() {
    return this._column;
  }
  scrollTo(position, ifVisible) {
    return this._column.table.columnManager.scrollToColumn(this._column, position, ifVisible);
  }
  getTable() {
    return this._column.table;
  }
  move(to, after) {
    var toColumn = this._column.table.columnManager.findColumn(to);
    if (toColumn) {
      this._column.table.columnManager.moveColumn(this._column, toColumn, after);
    } else {
      console.warn("Move Error - No matching column found:", toColumn);
    }
  }
  getNextColumn() {
    var nextCol = this._column.nextColumn();
    return nextCol ? nextCol.getComponent() : false;
  }
  getPrevColumn() {
    var prevCol = this._column.prevColumn();
    return prevCol ? prevCol.getComponent() : false;
  }
  updateDefinition(updates) {
    return this._column.updateDefinition(updates);
  }
  getWidth() {
    return this._column.getWidth();
  }
  setWidth(width) {
    var result;
    if (width === true) {
      result = this._column.reinitializeWidth(true);
    } else {
      result = this._column.setWidth(width);
    }
    this._column.table.columnManager.rerenderColumns(true);
    return result;
  }
}
var defaultColumnOptions = {
  "title": void 0,
  "field": void 0,
  "columns": void 0,
  "visible": void 0,
  "hozAlign": void 0,
  "vertAlign": void 0,
  "width": void 0,
  "minWidth": 40,
  "maxWidth": void 0,
  "maxInitialWidth": void 0,
  "cssClass": void 0,
  "variableHeight": void 0,
  "headerVertical": void 0,
  "headerHozAlign": void 0,
  "headerWordWrap": false,
  "editableTitle": void 0
};
class Column extends CoreFeature {
  static defaultOptionList = defaultColumnOptions;
  constructor(def, parent, rowHeader) {
    super(parent.table);
    this.definition = def;
    this.parent = parent;
    this.type = "column";
    this.columns = [];
    this.cells = [];
    this.isGroup = false;
    this.isRowHeader = rowHeader;
    this.element = this.createElement();
    this.contentElement = false;
    this.titleHolderElement = false;
    this.titleElement = false;
    this.groupElement = this.createGroupElement();
    this.hozAlign = "";
    this.vertAlign = "";
    this.field = "";
    this.fieldStructure = "";
    this.getFieldValue = "";
    this.setFieldValue = "";
    this.titleDownload = null;
    this.titleFormatterRendered = false;
    this.mapDefinitions();
    this.setField(this.definition.field);
    this.modules = {};
    this.width = null;
    this.widthStyled = "";
    this.maxWidth = null;
    this.maxWidthStyled = "";
    this.maxInitialWidth = null;
    this.minWidth = null;
    this.minWidthStyled = "";
    this.widthFixed = false;
    this.visible = true;
    this.component = null;
    if (this.definition.columns) {
      this.isGroup = true;
      this.definition.columns.forEach((def2, i) => {
        var newCol = new Column(def2, this);
        this.attachColumn(newCol);
      });
      this.checkColumnVisibility();
    } else {
      parent.registerColumnField(this);
    }
    this._initialize();
  }
  createElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-col");
    el.setAttribute("role", "columnheader");
    el.setAttribute("aria-sort", "none");
    if (this.isRowHeader) {
      el.classList.add("tabulator-row-header");
    }
    switch (this.table.options.columnHeaderVertAlign) {
      case "middle":
        el.style.justifyContent = "center";
        break;
      case "bottom":
        el.style.justifyContent = "flex-end";
        break;
    }
    return el;
  }
  createGroupElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-col-group-cols");
    return el;
  }
  mapDefinitions() {
    var defaults = this.table.options.columnDefaults;
    if (defaults) {
      for (let key in defaults) {
        if (typeof this.definition[key] === "undefined") {
          this.definition[key] = defaults[key];
        }
      }
    }
    this.definition = this.table.columnManager.optionsList.generate(Column.defaultOptionList, this.definition);
  }
  checkDefinition() {
    Object.keys(this.definition).forEach((key) => {
      if (Column.defaultOptionList.indexOf(key) === -1) {
        console.warn("Invalid column definition option in '" + (this.field || this.definition.title) + "' column:", key);
      }
    });
  }
  setField(field) {
    this.field = field;
    this.fieldStructure = field ? this.table.options.nestedFieldSeparator ? field.split(this.table.options.nestedFieldSeparator) : [field] : [];
    this.getFieldValue = this.fieldStructure.length > 1 ? this._getNestedData : this._getFlatData;
    this.setFieldValue = this.fieldStructure.length > 1 ? this._setNestedData : this._setFlatData;
  }
  //register column position with column manager
  registerColumnPosition(column) {
    this.parent.registerColumnPosition(column);
  }
  //register column position with column manager
  registerColumnField(column) {
    this.parent.registerColumnField(column);
  }
  //trigger position registration
  reRegisterPosition() {
    if (this.isGroup) {
      this.columns.forEach(function(column) {
        column.reRegisterPosition();
      });
    } else {
      this.registerColumnPosition(this);
    }
  }
  //build header element
  _initialize() {
    var def = this.definition;
    while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
    if (def.headerVertical) {
      this.element.classList.add("tabulator-col-vertical");
      if (def.headerVertical === "flip") {
        this.element.classList.add("tabulator-col-vertical-flip");
      }
    }
    this.contentElement = this._buildColumnHeaderContent();
    this.element.appendChild(this.contentElement);
    if (this.isGroup) {
      this._buildGroupHeader();
    } else {
      this._buildColumnHeader();
    }
    this.dispatch("column-init", this);
  }
  //build header element for header
  _buildColumnHeader() {
    var def = this.definition;
    this.dispatch("column-layout", this);
    if (typeof def.visible != "undefined") {
      if (def.visible) {
        this.show(true);
      } else {
        this.hide(true);
      }
    }
    if (def.cssClass) {
      var classNames = def.cssClass.split(" ");
      classNames.forEach((className) => {
        this.element.classList.add(className);
      });
    }
    if (def.field) {
      this.element.setAttribute("tabulator-field", def.field);
    }
    this.setMinWidth(parseInt(def.minWidth));
    if (def.maxInitialWidth) {
      this.maxInitialWidth = parseInt(def.maxInitialWidth);
    }
    if (def.maxWidth) {
      this.setMaxWidth(parseInt(def.maxWidth));
    }
    this.reinitializeWidth();
    this.hozAlign = this.definition.hozAlign;
    this.vertAlign = this.definition.vertAlign;
    this.titleElement.style.textAlign = this.definition.headerHozAlign;
  }
  _buildColumnHeaderContent() {
    var contentElement = document.createElement("div");
    contentElement.classList.add("tabulator-col-content");
    this.titleHolderElement = document.createElement("div");
    this.titleHolderElement.classList.add("tabulator-col-title-holder");
    contentElement.appendChild(this.titleHolderElement);
    this.titleElement = this._buildColumnHeaderTitle();
    this.titleHolderElement.appendChild(this.titleElement);
    return contentElement;
  }
  //build title element of column
  _buildColumnHeaderTitle() {
    var def = this.definition;
    var titleHolderElement = document.createElement("div");
    titleHolderElement.classList.add("tabulator-col-title");
    if (def.headerWordWrap) {
      titleHolderElement.classList.add("tabulator-col-title-wrap");
    }
    if (def.editableTitle) {
      var titleElement = document.createElement("input");
      titleElement.classList.add("tabulator-title-editor");
      titleElement.addEventListener("click", (e) => {
        e.stopPropagation();
        titleElement.focus();
      });
      titleElement.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
      titleElement.addEventListener("change", () => {
        def.title = titleElement.value;
        this.dispatchExternal("columnTitleChanged", this.getComponent());
      });
      titleHolderElement.appendChild(titleElement);
      if (def.field) {
        this.langBind("columns|" + def.field, (text) => {
          titleElement.value = text || (def.title || "&nbsp;");
        });
      } else {
        titleElement.value = def.title || "&nbsp;";
      }
    } else {
      if (def.field) {
        this.langBind("columns|" + def.field, (text) => {
          this._formatColumnHeaderTitle(titleHolderElement, text || (def.title || "&nbsp;"));
        });
      } else {
        this._formatColumnHeaderTitle(titleHolderElement, def.title || "&nbsp;");
      }
    }
    return titleHolderElement;
  }
  _formatColumnHeaderTitle(el, title) {
    var contents = this.chain("column-format", [this, title, el], null, () => {
      return title;
    });
    switch (typeof contents) {
      case "object":
        if (contents instanceof Node) {
          el.appendChild(contents);
        } else {
          el.innerHTML = "";
          console.warn("Format Error - Title formatter has returned a type of object, the only valid formatter object return is an instance of Node, the formatter returned:", contents);
        }
        break;
      case "undefined":
        el.innerHTML = "";
        break;
      default:
        el.innerHTML = contents;
    }
  }
  //build header element for column group
  _buildGroupHeader() {
    this.element.classList.add("tabulator-col-group");
    this.element.setAttribute("role", "columngroup");
    this.element.setAttribute("aria-title", this.definition.title);
    if (this.definition.cssClass) {
      var classNames = this.definition.cssClass.split(" ");
      classNames.forEach((className) => {
        this.element.classList.add(className);
      });
    }
    this.titleElement.style.textAlign = this.definition.headerHozAlign;
    this.element.appendChild(this.groupElement);
  }
  //flat field lookup
  _getFlatData(data) {
    return data[this.field];
  }
  //nested field lookup
  _getNestedData(data) {
    var dataObj = data, structure = this.fieldStructure, length = structure.length, output;
    for (let i = 0; i < length; i++) {
      dataObj = dataObj[structure[i]];
      output = dataObj;
      if (!dataObj) {
        break;
      }
    }
    return output;
  }
  //flat field set
  _setFlatData(data, value) {
    if (this.field) {
      data[this.field] = value;
    }
  }
  //nested field set
  _setNestedData(data, value) {
    var dataObj = data, structure = this.fieldStructure, length = structure.length;
    for (let i = 0; i < length; i++) {
      if (i == length - 1) {
        dataObj[structure[i]] = value;
      } else {
        if (!dataObj[structure[i]]) {
          if (typeof value !== "undefined") {
            dataObj[structure[i]] = {};
          } else {
            break;
          }
        }
        dataObj = dataObj[structure[i]];
      }
    }
  }
  //attach column to this group
  attachColumn(column) {
    if (this.groupElement) {
      this.columns.push(column);
      this.groupElement.appendChild(column.getElement());
      column.columnRendered();
    } else {
      console.warn("Column Warning - Column being attached to another column instead of column group");
    }
  }
  //vertically align header in column
  verticalAlign(alignment, height) {
    var parentHeight = this.parent.isGroup ? this.parent.getGroupElement().clientHeight : height || this.parent.getHeadersElement().clientHeight;
    this.element.style.height = parentHeight + "px";
    this.dispatch("column-height", this, this.element.style.height);
    if (this.isGroup) {
      this.groupElement.style.minHeight = parentHeight - this.contentElement.offsetHeight + "px";
    }
    this.columns.forEach(function(column) {
      column.verticalAlign(alignment);
    });
  }
  //clear vertical alignment
  clearVerticalAlign() {
    this.element.style.paddingTop = "";
    this.element.style.height = "";
    this.element.style.minHeight = "";
    this.groupElement.style.minHeight = "";
    this.columns.forEach(function(column) {
      column.clearVerticalAlign();
    });
    this.dispatch("column-height", this, "");
  }
  //// Retrieve Column Information ////
  //return column header element
  getElement() {
    return this.element;
  }
  //return column group element
  getGroupElement() {
    return this.groupElement;
  }
  //return field name
  getField() {
    return this.field;
  }
  getTitleDownload() {
    return this.titleDownload;
  }
  //return the first column in a group
  getFirstColumn() {
    if (!this.isGroup) {
      return this;
    } else {
      if (this.columns.length) {
        return this.columns[0].getFirstColumn();
      } else {
        return false;
      }
    }
  }
  //return the last column in a group
  getLastColumn() {
    if (!this.isGroup) {
      return this;
    } else {
      if (this.columns.length) {
        return this.columns[this.columns.length - 1].getLastColumn();
      } else {
        return false;
      }
    }
  }
  //return all columns in a group
  getColumns(traverse) {
    var columns = [];
    if (traverse) {
      this.columns.forEach((column) => {
        columns.push(column);
        columns = columns.concat(column.getColumns(true));
      });
    } else {
      columns = this.columns;
    }
    return columns;
  }
  //return all columns in a group
  getCells() {
    return this.cells;
  }
  //retrieve the top column in a group of columns
  getTopColumn() {
    if (this.parent.isGroup) {
      return this.parent.getTopColumn();
    } else {
      return this;
    }
  }
  //return column definition object
  getDefinition(updateBranches) {
    var colDefs = [];
    if (this.isGroup && updateBranches) {
      this.columns.forEach(function(column) {
        colDefs.push(column.getDefinition(true));
      });
      this.definition.columns = colDefs;
    }
    return this.definition;
  }
  //////////////////// Actions ////////////////////
  checkColumnVisibility() {
    var visible = false;
    this.columns.forEach(function(column) {
      if (column.visible) {
        visible = true;
      }
    });
    if (visible) {
      this.show();
      this.dispatchExternal("columnVisibilityChanged", this.getComponent(), false);
    } else {
      this.hide();
    }
  }
  //show column
  show(silent, responsiveToggle) {
    if (!this.visible) {
      this.visible = true;
      this.element.style.display = "";
      if (this.parent.isGroup) {
        this.parent.checkColumnVisibility();
      }
      this.cells.forEach(function(cell) {
        cell.show();
      });
      if (!this.isGroup && this.width === null) {
        this.reinitializeWidth();
      }
      this.table.columnManager.verticalAlignHeaders();
      this.dispatch("column-show", this, responsiveToggle);
      if (!silent) {
        this.dispatchExternal("columnVisibilityChanged", this.getComponent(), true);
      }
      if (this.parent.isGroup) {
        this.parent.matchChildWidths();
      }
      if (!this.silent) {
        this.table.columnManager.rerenderColumns();
      }
    }
  }
  //hide column
  hide(silent, responsiveToggle) {
    if (this.visible) {
      this.visible = false;
      this.element.style.display = "none";
      this.table.columnManager.verticalAlignHeaders();
      if (this.parent.isGroup) {
        this.parent.checkColumnVisibility();
      }
      this.cells.forEach(function(cell) {
        cell.hide();
      });
      this.dispatch("column-hide", this, responsiveToggle);
      if (!silent) {
        this.dispatchExternal("columnVisibilityChanged", this.getComponent(), false);
      }
      if (this.parent.isGroup) {
        this.parent.matchChildWidths();
      }
      if (!this.silent) {
        this.table.columnManager.rerenderColumns();
      }
    }
  }
  matchChildWidths() {
    var childWidth = 0;
    if (this.contentElement && this.columns.length) {
      this.columns.forEach(function(column) {
        if (column.visible) {
          childWidth += column.getWidth();
        }
      });
      this.contentElement.style.maxWidth = childWidth - 1 + "px";
      if (this.table.initialized) {
        this.element.style.width = childWidth + "px";
      }
      if (this.parent.isGroup) {
        this.parent.matchChildWidths();
      }
    }
  }
  removeChild(child) {
    var index = this.columns.indexOf(child);
    if (index > -1) {
      this.columns.splice(index, 1);
    }
    if (!this.columns.length) {
      this.delete();
    }
  }
  setWidth(width) {
    this.widthFixed = true;
    this.setWidthActual(width);
  }
  setWidthActual(width) {
    if (isNaN(width)) {
      width = Math.floor(this.table.element.clientWidth / 100 * parseInt(width));
    }
    width = Math.max(this.minWidth, width);
    if (this.maxWidth) {
      width = Math.min(this.maxWidth, width);
    }
    this.width = width;
    this.widthStyled = width ? width + "px" : "";
    this.element.style.width = this.widthStyled;
    if (!this.isGroup) {
      this.cells.forEach(function(cell) {
        cell.setWidth();
      });
    }
    if (this.parent.isGroup) {
      this.parent.matchChildWidths();
    }
    this.dispatch("column-width", this);
    if (this.subscribedExternal("columnWidth")) {
      this.dispatchExternal("columnWidth", this.getComponent());
    }
  }
  checkCellHeights() {
    var rows2 = [];
    this.cells.forEach(function(cell) {
      if (cell.row.heightInitialized) {
        if (cell.row.getElement().offsetParent !== null) {
          rows2.push(cell.row);
          cell.row.clearCellHeight();
        } else {
          cell.row.heightInitialized = false;
        }
      }
    });
    rows2.forEach(function(row) {
      row.calcHeight();
    });
    rows2.forEach(function(row) {
      row.setCellHeight();
    });
  }
  getWidth() {
    var width = 0;
    if (this.isGroup) {
      this.columns.forEach(function(column) {
        if (column.visible) {
          width += column.getWidth();
        }
      });
    } else {
      width = this.width;
    }
    return width;
  }
  getLeftOffset() {
    var offset2 = this.element.offsetLeft;
    if (this.parent.isGroup) {
      offset2 += this.parent.getLeftOffset();
    }
    return offset2;
  }
  getHeight() {
    return Math.ceil(this.element.getBoundingClientRect().height);
  }
  setMinWidth(minWidth) {
    if (this.maxWidth && minWidth > this.maxWidth) {
      minWidth = this.maxWidth;
      console.warn("the minWidth (" + minWidth + "px) for column '" + this.field + "' cannot be bigger that its maxWidth (" + this.maxWidthStyled + ")");
    }
    this.minWidth = minWidth;
    this.minWidthStyled = minWidth ? minWidth + "px" : "";
    this.element.style.minWidth = this.minWidthStyled;
    this.cells.forEach(function(cell) {
      cell.setMinWidth();
    });
  }
  setMaxWidth(maxWidth) {
    if (this.minWidth && maxWidth < this.minWidth) {
      maxWidth = this.minWidth;
      console.warn("the maxWidth (" + maxWidth + "px) for column '" + this.field + "' cannot be smaller that its minWidth (" + this.minWidthStyled + ")");
    }
    this.maxWidth = maxWidth;
    this.maxWidthStyled = maxWidth ? maxWidth + "px" : "";
    this.element.style.maxWidth = this.maxWidthStyled;
    this.cells.forEach(function(cell) {
      cell.setMaxWidth();
    });
  }
  delete() {
    return new Promise((resolve, reject) => {
      if (this.isGroup) {
        this.columns.forEach(function(column) {
          column.delete();
        });
      }
      this.dispatch("column-delete", this);
      var cellCount = this.cells.length;
      for (let i = 0; i < cellCount; i++) {
        this.cells[0].delete();
      }
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = false;
      this.contentElement = false;
      this.titleElement = false;
      this.groupElement = false;
      if (this.parent.isGroup) {
        this.parent.removeChild(this);
      }
      this.table.columnManager.deregisterColumn(this);
      this.table.columnManager.rerenderColumns(true);
      this.dispatch("column-deleted", this);
      resolve();
    });
  }
  columnRendered() {
    if (this.titleFormatterRendered) {
      this.titleFormatterRendered();
    }
    this.dispatch("column-rendered", this);
  }
  //////////////// Cell Management /////////////////
  //generate cell for this column
  generateCell(row) {
    var cell = new Cell(this, row);
    this.cells.push(cell);
    return cell;
  }
  nextColumn() {
    var index = this.table.columnManager.findColumnIndex(this);
    return index > -1 ? this._nextVisibleColumn(index + 1) : false;
  }
  _nextVisibleColumn(index) {
    var column = this.table.columnManager.getColumnByIndex(index);
    return !column || column.visible ? column : this._nextVisibleColumn(index + 1);
  }
  prevColumn() {
    var index = this.table.columnManager.findColumnIndex(this);
    return index > -1 ? this._prevVisibleColumn(index - 1) : false;
  }
  _prevVisibleColumn(index) {
    var column = this.table.columnManager.getColumnByIndex(index);
    return !column || column.visible ? column : this._prevVisibleColumn(index - 1);
  }
  reinitializeWidth(force) {
    this.widthFixed = false;
    if (typeof this.definition.width !== "undefined" && !force) {
      this.setWidth(this.definition.width);
    }
    this.dispatch("column-width-fit-before", this);
    this.fitToData(force);
    this.dispatch("column-width-fit-after", this);
  }
  //set column width to maximum cell width for non group columns
  fitToData(force) {
    if (this.isGroup) {
      return;
    }
    if (!this.widthFixed) {
      this.element.style.width = "";
      this.cells.forEach((cell) => {
        cell.clearWidth();
      });
    }
    var maxWidth = this.element.offsetWidth;
    if (!this.width || !this.widthFixed) {
      this.cells.forEach((cell) => {
        var width = cell.getWidth();
        if (width > maxWidth) {
          maxWidth = width;
        }
      });
      if (maxWidth) {
        var setTo = maxWidth + 1;
        if (force) {
          this.setWidth(setTo);
        } else {
          if (this.maxInitialWidth && !force) {
            setTo = Math.min(setTo, this.maxInitialWidth);
          }
          this.setWidthActual(setTo);
        }
      }
    }
  }
  updateDefinition(updates) {
    var definition;
    if (!this.isGroup) {
      if (!this.parent.isGroup) {
        definition = Object.assign({}, this.getDefinition());
        definition = Object.assign(definition, updates);
        return this.table.columnManager.addColumn(definition, false, this).then((column) => {
          if (definition.field == this.field) {
            this.field = false;
          }
          return this.delete().then(() => {
            return column.getComponent();
          });
        });
      } else {
        console.error("Column Update Error - The updateDefinition function is only available on ungrouped columns");
        return Promise.reject("Column Update Error - The updateDefinition function is only available on columns, not column groups");
      }
    } else {
      console.error("Column Update Error - The updateDefinition function is only available on ungrouped columns");
      return Promise.reject("Column Update Error - The updateDefinition function is only available on columns, not column groups");
    }
  }
  deleteCell(cell) {
    var index = this.cells.indexOf(cell);
    if (index > -1) {
      this.cells.splice(index, 1);
    }
  }
  //////////////// Object Generation /////////////////
  getComponent() {
    if (!this.component) {
      this.component = new ColumnComponent(this);
    }
    return this.component;
  }
  getPosition() {
    return this.table.columnManager.getVisibleColumnsByIndex().indexOf(this) + 1;
  }
  getParentComponent() {
    return this.parent instanceof Column ? this.parent.getComponent() : false;
  }
}
class RowComponent {
  constructor(row) {
    this._row = row;
    return new Proxy(this, {
      get: function(target, name, receiver) {
        if (typeof target[name] !== "undefined") {
          return target[name];
        } else {
          return target._row.table.componentFunctionBinder.handle("row", target._row, name);
        }
      }
    });
  }
  getData(transform) {
    return this._row.getData(transform);
  }
  getElement() {
    return this._row.getElement();
  }
  getCells() {
    var cells = [];
    this._row.getCells().forEach(function(cell) {
      cells.push(cell.getComponent());
    });
    return cells;
  }
  getCell(column) {
    var cell = this._row.getCell(column);
    return cell ? cell.getComponent() : false;
  }
  getIndex() {
    return this._row.getData("data")[this._row.table.options.index];
  }
  getPosition() {
    return this._row.getPosition();
  }
  watchPosition(callback) {
    return this._row.watchPosition(callback);
  }
  delete() {
    return this._row.delete();
  }
  scrollTo(position, ifVisible) {
    return this._row.table.rowManager.scrollToRow(this._row, position, ifVisible);
  }
  move(to, after) {
    this._row.moveToRow(to, after);
  }
  update(data) {
    return this._row.updateData(data);
  }
  normalizeHeight() {
    this._row.normalizeHeight(true);
  }
  _getSelf() {
    return this._row;
  }
  reformat() {
    return this._row.reinitialize();
  }
  getTable() {
    return this._row.table;
  }
  getNextRow() {
    var row = this._row.nextRow();
    return row ? row.getComponent() : row;
  }
  getPrevRow() {
    var row = this._row.prevRow();
    return row ? row.getComponent() : row;
  }
}
class Row extends CoreFeature {
  constructor(data, parent, type = "row") {
    super(parent.table);
    this.parent = parent;
    this.data = {};
    this.type = type;
    this.element = false;
    this.modules = {};
    this.cells = [];
    this.height = 0;
    this.heightStyled = "";
    this.manualHeight = false;
    this.outerHeight = 0;
    this.initialized = false;
    this.heightInitialized = false;
    this.position = 0;
    this.positionWatchers = [];
    this.component = null;
    this.created = false;
    this.setData(data);
  }
  create() {
    if (!this.created) {
      this.created = true;
      this.generateElement();
    }
  }
  createElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-row");
    el.setAttribute("role", "row");
    this.element = el;
  }
  getElement() {
    this.create();
    return this.element;
  }
  detachElement() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
  generateElement() {
    this.createElement();
    this.dispatch("row-init", this);
  }
  generateCells() {
    this.cells = this.table.columnManager.generateCells(this);
  }
  //functions to setup on first render
  initialize(force, inFragment) {
    this.create();
    if (!this.initialized || force) {
      this.deleteCells();
      while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
      this.dispatch("row-layout-before", this);
      this.generateCells();
      this.initialized = true;
      this.table.columnManager.renderer.renderRowCells(this, inFragment);
      if (force) {
        this.normalizeHeight();
      }
      this.dispatch("row-layout", this);
      if (this.table.options.rowFormatter) {
        this.table.options.rowFormatter(this.getComponent());
      }
      this.dispatch("row-layout-after", this);
    } else {
      this.table.columnManager.renderer.rerenderRowCells(this, inFragment);
    }
  }
  rendered() {
    this.cells.forEach((cell) => {
      cell.cellRendered();
    });
  }
  reinitializeHeight() {
    this.heightInitialized = false;
    if (this.element && this.element.offsetParent !== null) {
      this.normalizeHeight(true);
    }
  }
  deinitialize() {
    this.initialized = false;
  }
  deinitializeHeight() {
    this.heightInitialized = false;
  }
  reinitialize(children) {
    this.initialized = false;
    this.heightInitialized = false;
    if (!this.manualHeight) {
      this.height = 0;
      this.heightStyled = "";
    }
    if (this.element && this.element.offsetParent !== null) {
      this.initialize(true);
    }
    this.dispatch("row-relayout", this);
  }
  //get heights when doing bulk row style calcs in virtual DOM
  calcHeight(force) {
    var maxHeight = 0, minHeight = 0;
    if (this.table.options.rowHeight) {
      this.height = this.table.options.rowHeight;
    } else {
      minHeight = this.calcMinHeight();
      maxHeight = this.calcMaxHeight();
      if (force) {
        this.height = Math.max(maxHeight, minHeight);
      } else {
        this.height = this.manualHeight ? this.height : Math.max(maxHeight, minHeight);
      }
    }
    this.heightStyled = this.height ? this.height + "px" : "";
    this.outerHeight = this.element.offsetHeight;
  }
  calcMinHeight() {
    return this.table.options.resizableRows ? this.element.clientHeight : 0;
  }
  calcMaxHeight() {
    var maxHeight = 0;
    this.cells.forEach(function(cell) {
      var height = cell.getHeight();
      if (height > maxHeight) {
        maxHeight = height;
      }
    });
    return maxHeight;
  }
  //set of cells
  setCellHeight() {
    this.cells.forEach(function(cell) {
      cell.setHeight();
    });
    this.heightInitialized = true;
  }
  clearCellHeight() {
    this.cells.forEach(function(cell) {
      cell.clearHeight();
    });
  }
  //normalize the height of elements in the row
  normalizeHeight(force) {
    if (force && !this.table.options.rowHeight) {
      this.clearCellHeight();
    }
    this.calcHeight(force);
    this.setCellHeight();
  }
  //set height of rows
  setHeight(height, force) {
    if (this.height != height || force) {
      this.manualHeight = true;
      this.height = height;
      this.heightStyled = height ? height + "px" : "";
      this.setCellHeight();
      this.outerHeight = this.element.offsetHeight;
      if (this.subscribedExternal("rowHeight")) {
        this.dispatchExternal("rowHeight", this.getComponent());
      }
    }
  }
  //return rows outer height
  getHeight() {
    return this.outerHeight;
  }
  //return rows outer Width
  getWidth() {
    return this.element.offsetWidth;
  }
  //////////////// Cell Management /////////////////
  deleteCell(cell) {
    var index = this.cells.indexOf(cell);
    if (index > -1) {
      this.cells.splice(index, 1);
    }
  }
  //////////////// Data Management /////////////////
  setData(data) {
    this.data = this.chain("row-data-init-before", [this, data], void 0, data);
    this.dispatch("row-data-init-after", this);
  }
  //update the rows data
  updateData(updatedData) {
    var visible = this.element && Helpers.elVisible(this.element), tempData = {}, newRowData;
    return new Promise((resolve, reject) => {
      if (typeof updatedData === "string") {
        updatedData = JSON.parse(updatedData);
      }
      this.dispatch("row-data-save-before", this);
      if (this.subscribed("row-data-changing")) {
        tempData = Object.assign(tempData, this.data);
        tempData = Object.assign(tempData, updatedData);
      }
      newRowData = this.chain("row-data-changing", [this, tempData, updatedData], null, updatedData);
      for (let attrname in newRowData) {
        this.data[attrname] = newRowData[attrname];
      }
      this.dispatch("row-data-save-after", this);
      for (let attrname in updatedData) {
        let columns = this.table.columnManager.getColumnsByFieldRoot(attrname);
        columns.forEach((column) => {
          let cell = this.getCell(column.getField());
          if (cell) {
            let value = column.getFieldValue(newRowData);
            if (cell.getValue() !== value) {
              cell.setValueProcessData(value);
              if (visible) {
                cell.cellRendered();
              }
            }
          }
        });
      }
      if (visible) {
        this.normalizeHeight(true);
        if (this.table.options.rowFormatter) {
          this.table.options.rowFormatter(this.getComponent());
        }
      } else {
        this.initialized = false;
        this.height = 0;
        this.heightStyled = "";
      }
      this.dispatch("row-data-changed", this, visible, updatedData);
      this.dispatchExternal("rowUpdated", this.getComponent());
      if (this.subscribedExternal("dataChanged")) {
        this.dispatchExternal("dataChanged", this.table.rowManager.getData());
      }
      resolve();
    });
  }
  getData(transform) {
    if (transform) {
      return this.chain("row-data-retrieve", [this, transform], null, this.data);
    }
    return this.data;
  }
  getCell(column) {
    var match2 = false;
    column = this.table.columnManager.findColumn(column);
    if (!this.initialized && this.cells.length === 0) {
      this.generateCells();
    }
    match2 = this.cells.find(function(cell) {
      return cell.column === column;
    });
    return match2;
  }
  getCellIndex(findCell) {
    return this.cells.findIndex(function(cell) {
      return cell === findCell;
    });
  }
  findCell(subject) {
    return this.cells.find((cell) => {
      return cell.element === subject;
    });
  }
  getCells() {
    if (!this.initialized && this.cells.length === 0) {
      this.generateCells();
    }
    return this.cells;
  }
  nextRow() {
    var row = this.table.rowManager.nextDisplayRow(this, true);
    return row || false;
  }
  prevRow() {
    var row = this.table.rowManager.prevDisplayRow(this, true);
    return row || false;
  }
  moveToRow(to, before) {
    var toRow = this.table.rowManager.findRow(to);
    if (toRow) {
      this.table.rowManager.moveRowActual(this, toRow, !before);
      this.table.rowManager.refreshActiveData("display", false, true);
    } else {
      console.warn("Move Error - No matching row found:", to);
    }
  }
  ///////////////////// Actions  /////////////////////
  delete() {
    this.dispatch("row-delete", this);
    this.deleteActual();
    return Promise.resolve();
  }
  deleteActual(blockRedraw) {
    this.detachModules();
    this.table.rowManager.deleteRow(this, blockRedraw);
    this.deleteCells();
    this.initialized = false;
    this.heightInitialized = false;
    this.element = false;
    this.dispatch("row-deleted", this);
  }
  detachModules() {
    this.dispatch("row-deleting", this);
  }
  deleteCells() {
    var cellCount = this.cells.length;
    for (let i = 0; i < cellCount; i++) {
      this.cells[0].delete();
    }
  }
  wipe() {
    this.detachModules();
    this.deleteCells();
    if (this.element) {
      while (this.element.firstChild) this.element.removeChild(this.element.firstChild);
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
    this.element = false;
    this.modules = {};
  }
  isDisplayed() {
    return this.table.rowManager.getDisplayRows().includes(this);
  }
  getPosition() {
    return this.isDisplayed() ? this.position : false;
  }
  setPosition(position) {
    if (position != this.position) {
      this.position = position;
      this.positionWatchers.forEach((callback) => {
        callback(this.position);
      });
    }
  }
  watchPosition(callback) {
    this.positionWatchers.push(callback);
    callback(this.position);
  }
  getGroup() {
    return this.modules.group || false;
  }
  //////////////// Object Generation /////////////////
  getComponent() {
    if (!this.component) {
      this.component = new RowComponent(this);
    }
    return this.component;
  }
}
var defaultFilters = {
  //equal to
  "=": function(filterVal, rowVal, rowData, filterParams) {
    return rowVal == filterVal ? true : false;
  },
  //less than
  "<": function(filterVal, rowVal, rowData, filterParams) {
    return rowVal < filterVal ? true : false;
  },
  //less than or equal to
  "<=": function(filterVal, rowVal, rowData, filterParams) {
    return rowVal <= filterVal ? true : false;
  },
  //greater than
  ">": function(filterVal, rowVal, rowData, filterParams) {
    return rowVal > filterVal ? true : false;
  },
  //greater than or equal to
  ">=": function(filterVal, rowVal, rowData, filterParams) {
    return rowVal >= filterVal ? true : false;
  },
  //not equal to
  "!=": function(filterVal, rowVal, rowData, filterParams) {
    return rowVal != filterVal ? true : false;
  },
  "regex": function(filterVal, rowVal, rowData, filterParams) {
    if (typeof filterVal == "string") {
      filterVal = new RegExp(filterVal);
    }
    return filterVal.test(rowVal);
  },
  //contains the string
  "like": function(filterVal, rowVal, rowData, filterParams) {
    if (filterVal === null || typeof filterVal === "undefined") {
      return rowVal === filterVal ? true : false;
    } else {
      if (typeof rowVal !== "undefined" && rowVal !== null) {
        return String(rowVal).toLowerCase().indexOf(filterVal.toLowerCase()) > -1;
      } else {
        return false;
      }
    }
  },
  //contains the keywords
  "keywords": function(filterVal, rowVal, rowData, filterParams) {
    var keywords = filterVal.toLowerCase().split(typeof filterParams.separator === "undefined" ? " " : filterParams.separator), value = String(rowVal === null || typeof rowVal === "undefined" ? "" : rowVal).toLowerCase(), matches = [];
    keywords.forEach((keyword) => {
      if (value.includes(keyword)) {
        matches.push(true);
      }
    });
    return filterParams.matchAll ? matches.length === keywords.length : !!matches.length;
  },
  //starts with the string
  "starts": function(filterVal, rowVal, rowData, filterParams) {
    if (filterVal === null || typeof filterVal === "undefined") {
      return rowVal === filterVal ? true : false;
    } else {
      if (typeof rowVal !== "undefined" && rowVal !== null) {
        return String(rowVal).toLowerCase().startsWith(filterVal.toLowerCase());
      } else {
        return false;
      }
    }
  },
  //ends with the string
  "ends": function(filterVal, rowVal, rowData, filterParams) {
    if (filterVal === null || typeof filterVal === "undefined") {
      return rowVal === filterVal ? true : false;
    } else {
      if (typeof rowVal !== "undefined" && rowVal !== null) {
        return String(rowVal).toLowerCase().endsWith(filterVal.toLowerCase());
      } else {
        return false;
      }
    }
  },
  //in array
  "in": function(filterVal, rowVal, rowData, filterParams) {
    if (Array.isArray(filterVal)) {
      return filterVal.length ? filterVal.indexOf(rowVal) > -1 : true;
    } else {
      console.warn("Filter Error - filter value is not an array:", filterVal);
      return false;
    }
  }
};
class Filter extends Module {
  static moduleName = "filter";
  //load defaults
  static filters = defaultFilters;
  constructor(table) {
    super(table);
    this.filterList = [];
    this.headerFilters = {};
    this.headerFilterColumns = [];
    this.prevHeaderFilterChangeCheck = "";
    this.prevHeaderFilterChangeCheck = "{}";
    this.changed = false;
    this.tableInitialized = false;
    this.registerTableOption("filterMode", "local");
    this.registerTableOption("initialFilter", false);
    this.registerTableOption("initialHeaderFilter", false);
    this.registerTableOption("headerFilterLiveFilterDelay", 300);
    this.registerTableOption("placeholderHeaderFilter", false);
    this.registerColumnOption("headerFilter");
    this.registerColumnOption("headerFilterPlaceholder");
    this.registerColumnOption("headerFilterParams");
    this.registerColumnOption("headerFilterEmptyCheck");
    this.registerColumnOption("headerFilterFunc");
    this.registerColumnOption("headerFilterFuncParams");
    this.registerColumnOption("headerFilterLiveFilter");
    this.registerTableFunction("searchRows", this.searchRows.bind(this));
    this.registerTableFunction("searchData", this.searchData.bind(this));
    this.registerTableFunction("setFilter", this.userSetFilter.bind(this));
    this.registerTableFunction("refreshFilter", this.userRefreshFilter.bind(this));
    this.registerTableFunction("addFilter", this.userAddFilter.bind(this));
    this.registerTableFunction("getFilters", this.getFilters.bind(this));
    this.registerTableFunction("setHeaderFilterFocus", this.userSetHeaderFilterFocus.bind(this));
    this.registerTableFunction("getHeaderFilterValue", this.userGetHeaderFilterValue.bind(this));
    this.registerTableFunction("setHeaderFilterValue", this.userSetHeaderFilterValue.bind(this));
    this.registerTableFunction("getHeaderFilters", this.getHeaderFilters.bind(this));
    this.registerTableFunction("removeFilter", this.userRemoveFilter.bind(this));
    this.registerTableFunction("clearFilter", this.userClearFilter.bind(this));
    this.registerTableFunction("clearHeaderFilter", this.userClearHeaderFilter.bind(this));
    this.registerComponentFunction("column", "headerFilterFocus", this.setHeaderFilterFocus.bind(this));
    this.registerComponentFunction("column", "reloadHeaderFilter", this.reloadHeaderFilter.bind(this));
    this.registerComponentFunction("column", "getHeaderFilterValue", this.getHeaderFilterValue.bind(this));
    this.registerComponentFunction("column", "setHeaderFilterValue", this.setHeaderFilterValue.bind(this));
  }
  initialize() {
    this.subscribe("column-init", this.initializeColumnHeaderFilter.bind(this));
    this.subscribe("column-width-fit-before", this.hideHeaderFilterElements.bind(this));
    this.subscribe("column-width-fit-after", this.showHeaderFilterElements.bind(this));
    this.subscribe("table-built", this.tableBuilt.bind(this));
    this.subscribe("placeholder", this.generatePlaceholder.bind(this));
    if (this.table.options.filterMode === "remote") {
      this.subscribe("data-params", this.remoteFilterParams.bind(this));
    }
    this.registerDataHandler(this.filter.bind(this), 10);
  }
  tableBuilt() {
    if (this.table.options.initialFilter) {
      this.setFilter(this.table.options.initialFilter);
    }
    if (this.table.options.initialHeaderFilter) {
      this.table.options.initialHeaderFilter.forEach((item) => {
        var column = this.table.columnManager.findColumn(item.field);
        if (column) {
          this.setHeaderFilterValue(column, item.value);
        } else {
          console.warn("Column Filter Error - No matching column found:", item.field);
          return false;
        }
      });
    }
    this.tableInitialized = true;
  }
  remoteFilterParams(data, config, silent, params) {
    params.filter = this.getFilters(true, true);
    return params;
  }
  generatePlaceholder(text) {
    if (this.table.options.placeholderHeaderFilter && Object.keys(this.headerFilters).length) {
      return this.table.options.placeholderHeaderFilter;
    }
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  //set standard filters
  userSetFilter(field, type, value, params) {
    this.setFilter(field, type, value, params);
    this.refreshFilter();
  }
  //set standard filters
  userRefreshFilter() {
    this.refreshFilter();
  }
  //add filter to array
  userAddFilter(field, type, value, params) {
    this.addFilter(field, type, value, params);
    this.refreshFilter();
  }
  userSetHeaderFilterFocus(field) {
    var column = this.table.columnManager.findColumn(field);
    if (column) {
      this.setHeaderFilterFocus(column);
    } else {
      console.warn("Column Filter Focus Error - No matching column found:", field);
      return false;
    }
  }
  userGetHeaderFilterValue(field) {
    var column = this.table.columnManager.findColumn(field);
    if (column) {
      return this.getHeaderFilterValue(column);
    } else {
      console.warn("Column Filter Error - No matching column found:", field);
    }
  }
  userSetHeaderFilterValue(field, value) {
    var column = this.table.columnManager.findColumn(field);
    if (column) {
      this.setHeaderFilterValue(column, value);
    } else {
      console.warn("Column Filter Error - No matching column found:", field);
      return false;
    }
  }
  //remove filter from array
  userRemoveFilter(field, type, value) {
    this.removeFilter(field, type, value);
    this.refreshFilter();
  }
  //clear filters
  userClearFilter(all) {
    this.clearFilter(all);
    this.refreshFilter();
  }
  //clear header filters
  userClearHeaderFilter() {
    this.clearHeaderFilter();
    this.refreshFilter();
  }
  //search for specific row components
  searchRows(field, type, value) {
    return this.search("rows", field, type, value);
  }
  //search for specific data
  searchData(field, type, value) {
    return this.search("data", field, type, value);
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  initializeColumnHeaderFilter(column) {
    var def = column.definition;
    if (def.headerFilter) {
      this.initializeColumn(column);
    }
  }
  //initialize column header filter
  initializeColumn(column, value) {
    var self = this, field = column.getField();
    function success(value2) {
      var filterType = column.modules.filter.tagType == "input" && column.modules.filter.attrType == "text" || column.modules.filter.tagType == "textarea" ? "partial" : "match", type = "", filterChangeCheck = "", filterFunc;
      if (typeof column.modules.filter.prevSuccess === "undefined" || column.modules.filter.prevSuccess !== value2) {
        column.modules.filter.prevSuccess = value2;
        if (!column.modules.filter.emptyFunc(value2)) {
          column.modules.filter.value = value2;
          switch (typeof column.definition.headerFilterFunc) {
            case "string":
              if (Filter.filters[column.definition.headerFilterFunc]) {
                type = column.definition.headerFilterFunc;
                filterFunc = function(data) {
                  var params = column.definition.headerFilterFuncParams || {};
                  var fieldVal = column.getFieldValue(data);
                  params = typeof params === "function" ? params(value2, fieldVal, data) : params;
                  return Filter.filters[column.definition.headerFilterFunc](value2, fieldVal, data, params);
                };
              } else {
                console.warn("Header Filter Error - Matching filter function not found: ", column.definition.headerFilterFunc);
              }
              break;
            case "function":
              filterFunc = function(data) {
                var params = column.definition.headerFilterFuncParams || {};
                var fieldVal = column.getFieldValue(data);
                params = typeof params === "function" ? params(value2, fieldVal, data) : params;
                return column.definition.headerFilterFunc(value2, fieldVal, data, params);
              };
              type = filterFunc;
              break;
          }
          if (!filterFunc) {
            switch (filterType) {
              case "partial":
                filterFunc = function(data) {
                  var colVal = column.getFieldValue(data);
                  if (typeof colVal !== "undefined" && colVal !== null) {
                    return String(colVal).toLowerCase().indexOf(String(value2).toLowerCase()) > -1;
                  } else {
                    return false;
                  }
                };
                type = "like";
                break;
              default:
                filterFunc = function(data) {
                  return column.getFieldValue(data) == value2;
                };
                type = "=";
            }
          }
          self.headerFilters[field] = { value: value2, func: filterFunc, type };
        } else {
          delete self.headerFilters[field];
        }
        column.modules.filter.value = value2;
        filterChangeCheck = JSON.stringify(self.headerFilters);
        if (self.prevHeaderFilterChangeCheck !== filterChangeCheck) {
          self.prevHeaderFilterChangeCheck = filterChangeCheck;
          self.trackChanges();
          self.refreshFilter();
        }
      }
      return true;
    }
    column.modules.filter = {
      success,
      attrType: false,
      tagType: false,
      emptyFunc: false
    };
    this.generateHeaderFilterElement(column);
  }
  generateHeaderFilterElement(column, initialValue, reinitialize) {
    var self = this, success = column.modules.filter.success, field = column.getField(), filterElement, editor, editorElement, cellWrapper, typingTimer, searchTrigger, params, onRenderedCallback;
    column.modules.filter.value = initialValue;
    function cancel() {
    }
    function onRendered(callback) {
      onRenderedCallback = callback;
    }
    if (column.modules.filter.headerElement && column.modules.filter.headerElement.parentNode) {
      column.contentElement.removeChild(column.modules.filter.headerElement.parentNode);
    }
    if (field) {
      column.modules.filter.emptyFunc = column.definition.headerFilterEmptyCheck || function(value) {
        return !value && value !== 0;
      };
      filterElement = document.createElement("div");
      filterElement.classList.add("tabulator-header-filter");
      switch (typeof column.definition.headerFilter) {
        case "string":
          if (self.table.modules.edit.editors[column.definition.headerFilter]) {
            editor = self.table.modules.edit.editors[column.definition.headerFilter];
            if ((column.definition.headerFilter === "tick" || column.definition.headerFilter === "tickCross") && !column.definition.headerFilterEmptyCheck) {
              column.modules.filter.emptyFunc = function(value) {
                return value !== true && value !== false;
              };
            }
          } else {
            console.warn("Filter Error - Cannot build header filter, No such editor found: ", column.definition.editor);
          }
          break;
        case "function":
          editor = column.definition.headerFilter;
          break;
        case "boolean":
          if (column.modules.edit && column.modules.edit.editor) {
            editor = column.modules.edit.editor;
          } else {
            if (column.definition.formatter && self.table.modules.edit.editors[column.definition.formatter]) {
              editor = self.table.modules.edit.editors[column.definition.formatter];
              if ((column.definition.formatter === "tick" || column.definition.formatter === "tickCross") && !column.definition.headerFilterEmptyCheck) {
                column.modules.filter.emptyFunc = function(value) {
                  return value !== true && value !== false;
                };
              }
            } else {
              editor = self.table.modules.edit.editors["input"];
            }
          }
          break;
      }
      if (editor) {
        cellWrapper = {
          getValue: function() {
            return typeof initialValue !== "undefined" ? initialValue : "";
          },
          getField: function() {
            return column.definition.field;
          },
          getElement: function() {
            return filterElement;
          },
          getColumn: function() {
            return column.getComponent();
          },
          getTable: () => {
            return this.table;
          },
          getType: () => {
            return "header";
          },
          getRow: function() {
            return {
              normalizeHeight: function() {
              }
            };
          }
        };
        params = column.definition.headerFilterParams || {};
        params = typeof params === "function" ? params.call(self.table, cellWrapper) : params;
        editorElement = editor.call(this.table.modules.edit, cellWrapper, onRendered, success, cancel, params);
        if (!editorElement) {
          console.warn("Filter Error - Cannot add filter to " + field + " column, editor returned a value of false");
          return;
        }
        if (!(editorElement instanceof Node)) {
          console.warn("Filter Error - Cannot add filter to " + field + " column, editor should return an instance of Node, the editor returned:", editorElement);
          return;
        }
        self.langBind("headerFilters|columns|" + column.definition.field, function(value) {
          editorElement.setAttribute("placeholder", typeof value !== "undefined" && value ? value : column.definition.headerFilterPlaceholder || self.langText("headerFilters|default"));
        });
        editorElement.addEventListener("click", function(e) {
          e.stopPropagation();
          editorElement.focus();
        });
        editorElement.addEventListener("focus", (e) => {
          var left = this.table.columnManager.contentsElement.scrollLeft;
          var headerPos = this.table.rowManager.element.scrollLeft;
          if (left !== headerPos) {
            this.table.rowManager.scrollHorizontal(left);
            this.table.columnManager.scrollHorizontal(left);
          }
        });
        typingTimer = false;
        searchTrigger = function(e) {
          if (typingTimer) {
            clearTimeout(typingTimer);
          }
          typingTimer = setTimeout(function() {
            success(editorElement.value);
          }, self.table.options.headerFilterLiveFilterDelay);
        };
        column.modules.filter.headerElement = editorElement;
        column.modules.filter.attrType = editorElement.hasAttribute("type") ? editorElement.getAttribute("type").toLowerCase() : "";
        column.modules.filter.tagType = editorElement.tagName.toLowerCase();
        if (column.definition.headerFilterLiveFilter !== false) {
          if (!(column.definition.headerFilter === "autocomplete" || column.definition.headerFilter === "tickCross" || (column.definition.editor === "autocomplete" || column.definition.editor === "tickCross") && column.definition.headerFilter === true)) {
            editorElement.addEventListener("keyup", searchTrigger);
            editorElement.addEventListener("search", searchTrigger);
            if (column.modules.filter.attrType == "number") {
              editorElement.addEventListener("change", function(e) {
                success(editorElement.value);
              });
            }
            if (column.modules.filter.attrType == "text" && this.table.browser !== "ie") {
              editorElement.setAttribute("type", "search");
            }
          }
          if (column.modules.filter.tagType == "input" || column.modules.filter.tagType == "select" || column.modules.filter.tagType == "textarea") {
            editorElement.addEventListener("mousedown", function(e) {
              e.stopPropagation();
            });
          }
        }
        filterElement.appendChild(editorElement);
        column.contentElement.appendChild(filterElement);
        if (!reinitialize) {
          self.headerFilterColumns.push(column);
        }
        if (onRenderedCallback) {
          onRenderedCallback();
        }
      }
    } else {
      console.warn("Filter Error - Cannot add header filter, column has no field set:", column.definition.title);
    }
  }
  //hide all header filter elements (used to ensure correct column widths in "fitData" layout mode)
  hideHeaderFilterElements() {
    this.headerFilterColumns.forEach(function(column) {
      if (column.modules.filter && column.modules.filter.headerElement) {
        column.modules.filter.headerElement.style.display = "none";
      }
    });
  }
  //show all header filter elements (used to ensure correct column widths in "fitData" layout mode)
  showHeaderFilterElements() {
    this.headerFilterColumns.forEach(function(column) {
      if (column.modules.filter && column.modules.filter.headerElement) {
        column.modules.filter.headerElement.style.display = "";
      }
    });
  }
  //programmatically set focus of header filter
  setHeaderFilterFocus(column) {
    if (column.modules.filter && column.modules.filter.headerElement) {
      column.modules.filter.headerElement.focus();
    } else {
      console.warn("Column Filter Focus Error - No header filter set on column:", column.getField());
    }
  }
  //programmatically get value of header filter
  getHeaderFilterValue(column) {
    if (column.modules.filter && column.modules.filter.headerElement) {
      return column.modules.filter.value;
    } else {
      console.warn("Column Filter Error - No header filter set on column:", column.getField());
    }
  }
  //programmatically set value of header filter
  setHeaderFilterValue(column, value) {
    if (column) {
      if (column.modules.filter && column.modules.filter.headerElement) {
        this.generateHeaderFilterElement(column, value, true);
        column.modules.filter.success(value);
      } else {
        console.warn("Column Filter Error - No header filter set on column:", column.getField());
      }
    }
  }
  reloadHeaderFilter(column) {
    if (column) {
      if (column.modules.filter && column.modules.filter.headerElement) {
        this.generateHeaderFilterElement(column, column.modules.filter.value, true);
      } else {
        console.warn("Column Filter Error - No header filter set on column:", column.getField());
      }
    }
  }
  refreshFilter() {
    if (this.tableInitialized) {
      if (this.table.options.filterMode === "remote") {
        this.reloadData(null, false, false);
      } else {
        this.refreshData(true);
      }
    }
  }
  //check if the filters has changed since last use
  trackChanges() {
    this.changed = true;
    this.dispatch("filter-changed");
  }
  //check if the filters has changed since last use
  hasChanged() {
    var changed = this.changed;
    this.changed = false;
    return changed;
  }
  //set standard filters
  setFilter(field, type, value, params) {
    this.filterList = [];
    if (!Array.isArray(field)) {
      field = [{ field, type, value, params }];
    }
    this.addFilter(field);
  }
  //add filter to array
  addFilter(field, type, value, params) {
    var changed = false;
    if (!Array.isArray(field)) {
      field = [{ field, type, value, params }];
    }
    field.forEach((filter) => {
      filter = this.findFilter(filter);
      if (filter) {
        this.filterList.push(filter);
        changed = true;
      }
    });
    if (changed) {
      this.trackChanges();
    }
  }
  findFilter(filter) {
    var column;
    if (Array.isArray(filter)) {
      return this.findSubFilters(filter);
    }
    var filterFunc = false;
    if (typeof filter.field == "function") {
      filterFunc = function(data) {
        return filter.field(data, filter.type || {});
      };
    } else {
      if (Filter.filters[filter.type]) {
        column = this.table.columnManager.getColumnByField(filter.field);
        if (column) {
          filterFunc = function(data) {
            return Filter.filters[filter.type](filter.value, column.getFieldValue(data), data, filter.params || {});
          };
        } else {
          filterFunc = function(data) {
            return Filter.filters[filter.type](filter.value, data[filter.field], data, filter.params || {});
          };
        }
      } else {
        console.warn("Filter Error - No such filter type found, ignoring: ", filter.type);
      }
    }
    filter.func = filterFunc;
    return filter.func ? filter : false;
  }
  findSubFilters(filters) {
    var output = [];
    filters.forEach((filter) => {
      filter = this.findFilter(filter);
      if (filter) {
        output.push(filter);
      }
    });
    return output.length ? output : false;
  }
  //get all filters
  getFilters(all, ajax) {
    var output = [];
    if (all) {
      output = this.getHeaderFilters();
    }
    if (ajax) {
      output.forEach(function(item) {
        if (typeof item.type == "function") {
          item.type = "function";
        }
      });
    }
    output = output.concat(this.filtersToArray(this.filterList, ajax));
    return output;
  }
  //filter to Object
  filtersToArray(filterList, ajax) {
    var output = [];
    filterList.forEach((filter) => {
      var item;
      if (Array.isArray(filter)) {
        output.push(this.filtersToArray(filter, ajax));
      } else {
        item = { field: filter.field, type: filter.type, value: filter.value };
        if (ajax) {
          if (typeof item.type == "function") {
            item.type = "function";
          }
        }
        output.push(item);
      }
    });
    return output;
  }
  //get all filters
  getHeaderFilters() {
    var output = [];
    for (var key in this.headerFilters) {
      output.push({ field: key, type: this.headerFilters[key].type, value: this.headerFilters[key].value });
    }
    return output;
  }
  //remove filter from array
  removeFilter(field, type, value) {
    if (!Array.isArray(field)) {
      field = [{ field, type, value }];
    }
    field.forEach((filter) => {
      var index = -1;
      if (typeof filter.field == "object") {
        index = this.filterList.findIndex((element) => {
          return filter === element;
        });
      } else {
        index = this.filterList.findIndex((element) => {
          return filter.field === element.field && filter.type === element.type && filter.value === element.value;
        });
      }
      if (index > -1) {
        this.filterList.splice(index, 1);
      } else {
        console.warn("Filter Error - No matching filter type found, ignoring: ", filter.type);
      }
    });
    this.trackChanges();
  }
  //clear filters
  clearFilter(all) {
    this.filterList = [];
    if (all) {
      this.clearHeaderFilter();
    }
    this.trackChanges();
  }
  //clear header filters
  clearHeaderFilter() {
    this.headerFilters = {};
    this.prevHeaderFilterChangeCheck = "{}";
    this.headerFilterColumns.forEach((column) => {
      if (typeof column.modules.filter.value !== "undefined") {
        delete column.modules.filter.value;
      }
      column.modules.filter.prevSuccess = void 0;
      this.reloadHeaderFilter(column);
    });
    this.trackChanges();
  }
  //search data and return matching rows
  search(searchType, field, type, value) {
    var activeRows = [], filterList = [];
    if (!Array.isArray(field)) {
      field = [{ field, type, value }];
    }
    field.forEach((filter) => {
      filter = this.findFilter(filter);
      if (filter) {
        filterList.push(filter);
      }
    });
    this.table.rowManager.rows.forEach((row) => {
      var match2 = true;
      filterList.forEach((filter) => {
        if (!this.filterRecurse(filter, row.getData())) {
          match2 = false;
        }
      });
      if (match2) {
        activeRows.push(searchType === "data" ? row.getData("data") : row.getComponent());
      }
    });
    return activeRows;
  }
  //filter row array
  filter(rowList, filters) {
    var activeRows = [], activeRowComponents = [];
    if (this.subscribedExternal("dataFiltering")) {
      this.dispatchExternal("dataFiltering", this.getFilters(true));
    }
    if (this.table.options.filterMode !== "remote" && (this.filterList.length || Object.keys(this.headerFilters).length)) {
      rowList.forEach((row) => {
        if (this.filterRow(row)) {
          activeRows.push(row);
        }
      });
    } else {
      activeRows = rowList.slice(0);
    }
    if (this.subscribedExternal("dataFiltered")) {
      activeRows.forEach((row) => {
        activeRowComponents.push(row.getComponent());
      });
      this.dispatchExternal("dataFiltered", this.getFilters(true), activeRowComponents);
    }
    return activeRows;
  }
  //filter individual row
  filterRow(row, filters) {
    var match2 = true, data = row.getData();
    this.filterList.forEach((filter) => {
      if (!this.filterRecurse(filter, data)) {
        match2 = false;
      }
    });
    for (var field in this.headerFilters) {
      if (!this.headerFilters[field].func(data)) {
        match2 = false;
      }
    }
    return match2;
  }
  filterRecurse(filter, data) {
    var match2 = false;
    if (Array.isArray(filter)) {
      filter.forEach((subFilter) => {
        if (this.filterRecurse(subFilter, data)) {
          match2 = true;
        }
      });
    } else {
      match2 = filter.func(data);
    }
    return match2;
  }
}
function plaintext(cell, formatterParams, onRendered) {
  return this.emptyToSpace(this.sanitizeHTML(cell.getValue()));
}
function html(cell, formatterParams, onRendered) {
  return cell.getValue();
}
function textarea(cell, formatterParams, onRendered) {
  cell.getElement().style.whiteSpace = "pre-wrap";
  return this.emptyToSpace(this.sanitizeHTML(cell.getValue()));
}
function money(cell, formatterParams, onRendered) {
  var floatVal = parseFloat(cell.getValue()), sign = "", number2, integer, decimal, rgx, value;
  var decimalSym = formatterParams.decimal || ".";
  var thousandSym = formatterParams.thousand || ",";
  var negativeSign = formatterParams.negativeSign || "-";
  var symbol = formatterParams.symbol || "";
  var after = !!formatterParams.symbolAfter;
  var precision = typeof formatterParams.precision !== "undefined" ? formatterParams.precision : 2;
  if (isNaN(floatVal)) {
    return this.emptyToSpace(this.sanitizeHTML(cell.getValue()));
  }
  if (floatVal < 0) {
    floatVal = Math.abs(floatVal);
    sign = negativeSign;
  }
  number2 = precision !== false ? floatVal.toFixed(precision) : floatVal;
  number2 = String(number2).split(".");
  integer = number2[0];
  decimal = number2.length > 1 ? decimalSym + number2[1] : "";
  if (formatterParams.thousand !== false) {
    rgx = /(\d+)(\d{3})/;
    while (rgx.test(integer)) {
      integer = integer.replace(rgx, "$1" + thousandSym + "$2");
    }
  }
  value = integer + decimal;
  if (sign === true) {
    value = "(" + value + ")";
    return after ? value + symbol : symbol + value;
  } else {
    return after ? sign + value + symbol : sign + symbol + value;
  }
}
function link(cell, formatterParams, onRendered) {
  var value = cell.getValue(), urlPrefix = formatterParams.urlPrefix || "", download = formatterParams.download, label = value, el = document.createElement("a"), data;
  function labelTraverse(path, data2) {
    var item = path.shift(), value2 = data2[item];
    if (path.length && typeof value2 === "object") {
      return labelTraverse(path, value2);
    }
    return value2;
  }
  if (formatterParams.labelField) {
    data = cell.getData();
    label = labelTraverse(formatterParams.labelField.split(this.table.options.nestedFieldSeparator), data);
  }
  if (formatterParams.label) {
    switch (typeof formatterParams.label) {
      case "string":
        label = formatterParams.label;
        break;
      case "function":
        label = formatterParams.label(cell);
        break;
    }
  }
  if (label) {
    if (formatterParams.urlField) {
      data = cell.getData();
      value = Helpers.retrieveNestedData(this.table.options.nestedFieldSeparator, formatterParams.urlField, data);
    }
    if (formatterParams.url) {
      switch (typeof formatterParams.url) {
        case "string":
          value = formatterParams.url;
          break;
        case "function":
          value = formatterParams.url(cell);
          break;
      }
    }
    el.setAttribute("href", urlPrefix + value);
    if (formatterParams.target) {
      el.setAttribute("target", formatterParams.target);
    }
    if (formatterParams.download) {
      if (typeof download == "function") {
        download = download(cell);
      } else {
        download = download === true ? "" : download;
      }
      el.setAttribute("download", download);
    }
    el.innerHTML = this.emptyToSpace(this.sanitizeHTML(label));
    return el;
  } else {
    return "&nbsp;";
  }
}
function image(cell, formatterParams, onRendered) {
  var el = document.createElement("img"), src = cell.getValue();
  if (formatterParams.urlPrefix) {
    src = formatterParams.urlPrefix + cell.getValue();
  }
  if (formatterParams.urlSuffix) {
    src = src + formatterParams.urlSuffix;
  }
  el.setAttribute("src", src);
  switch (typeof formatterParams.height) {
    case "number":
      el.style.height = formatterParams.height + "px";
      break;
    case "string":
      el.style.height = formatterParams.height;
      break;
  }
  switch (typeof formatterParams.width) {
    case "number":
      el.style.width = formatterParams.width + "px";
      break;
    case "string":
      el.style.width = formatterParams.width;
      break;
  }
  el.addEventListener("load", function() {
    cell.getRow().normalizeHeight();
  });
  return el;
}
function tickCross(cell, formatterParams, onRendered) {
  var value = cell.getValue(), element = cell.getElement(), empty = formatterParams.allowEmpty, truthy = formatterParams.allowTruthy, trueValueSet = Object.keys(formatterParams).includes("trueValue"), tick = typeof formatterParams.tickElement !== "undefined" ? formatterParams.tickElement : '<svg enable-background="new 0 0 24 24" height="14" width="14" viewBox="0 0 24 24" xml:space="preserve" ><path fill="#2DC214" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z" fill-rule="evenodd"/></svg>', cross = typeof formatterParams.crossElement !== "undefined" ? formatterParams.crossElement : '<svg enable-background="new 0 0 24 24" height="14" width="14"  viewBox="0 0 24 24" xml:space="preserve" ><path fill="#CE1515" d="M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272  c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0  l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269  c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73  L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z"/></svg>';
  if (trueValueSet && value === formatterParams.trueValue || !trueValueSet && (truthy && value || (value === true || value === "true" || value === "True" || value === 1 || value === "1"))) {
    element.setAttribute("aria-checked", true);
    return tick || "";
  } else {
    if (empty && (value === "null" || value === "" || value === null || typeof value === "undefined")) {
      element.setAttribute("aria-checked", "mixed");
      return "";
    } else {
      element.setAttribute("aria-checked", false);
      return cross || "";
    }
  }
}
function datetime$1(cell, formatterParams, onRendered) {
  var DT = this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime");
  var inputFormat = formatterParams.inputFormat || "yyyy-MM-dd HH:mm:ss";
  var outputFormat = formatterParams.outputFormat || "dd/MM/yyyy HH:mm:ss";
  var invalid = typeof formatterParams.invalidPlaceholder !== "undefined" ? formatterParams.invalidPlaceholder : "";
  var value = cell.getValue();
  if (typeof DT != "undefined") {
    var newDatetime;
    if (DT.isDateTime(value)) {
      newDatetime = value;
    } else if (inputFormat === "iso") {
      newDatetime = DT.fromISO(String(value));
    } else {
      newDatetime = DT.fromFormat(String(value), inputFormat);
    }
    if (newDatetime.isValid) {
      if (formatterParams.timezone) {
        newDatetime = newDatetime.setZone(formatterParams.timezone);
      }
      return newDatetime.toFormat(outputFormat);
    } else {
      if (invalid === true || !value) {
        return value;
      } else if (typeof invalid === "function") {
        return invalid(value);
      } else {
        return invalid;
      }
    }
  } else {
    console.error("Format Error - 'datetime' formatter is dependant on luxon.js");
  }
}
function datetimediff(cell, formatterParams, onRendered) {
  var DT = this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime");
  var inputFormat = formatterParams.inputFormat || "yyyy-MM-dd HH:mm:ss";
  var invalid = typeof formatterParams.invalidPlaceholder !== "undefined" ? formatterParams.invalidPlaceholder : "";
  var suffix = typeof formatterParams.suffix !== "undefined" ? formatterParams.suffix : false;
  var unit = typeof formatterParams.unit !== "undefined" ? formatterParams.unit : "days";
  var humanize = typeof formatterParams.humanize !== "undefined" ? formatterParams.humanize : false;
  var date2 = typeof formatterParams.date !== "undefined" ? formatterParams.date : DT.now();
  var value = cell.getValue();
  if (typeof DT != "undefined") {
    var newDatetime;
    if (DT.isDateTime(value)) {
      newDatetime = value;
    } else if (inputFormat === "iso") {
      newDatetime = DT.fromISO(String(value));
    } else {
      newDatetime = DT.fromFormat(String(value), inputFormat);
    }
    if (newDatetime.isValid) {
      if (humanize) {
        return newDatetime.diff(date2, unit).toHuman() + (suffix ? " " + suffix : "");
      } else {
        return parseInt(newDatetime.diff(date2, unit)[unit]) + (suffix ? " " + suffix : "");
      }
    } else {
      if (invalid === true) {
        return value;
      } else if (typeof invalid === "function") {
        return invalid(value);
      } else {
        return invalid;
      }
    }
  } else {
    console.error("Format Error - 'datetimediff' formatter is dependant on luxon.js");
  }
}
function lookup(cell, formatterParams, onRendered) {
  var value = cell.getValue();
  if (typeof formatterParams[value] === "undefined") {
    console.warn("Missing display value for " + value);
    return value;
  }
  return formatterParams[value];
}
function star(cell, formatterParams, onRendered) {
  var value = cell.getValue(), element = cell.getElement(), maxStars = formatterParams && formatterParams.stars ? formatterParams.stars : 5, stars = document.createElement("span"), star2 = document.createElementNS("http://www.w3.org/2000/svg", "svg"), starActive = '<polygon fill="#FFEA00" stroke="#C1AB60" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>', starInactive = '<polygon fill="#D2D2D2" stroke="#686868" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>';
  stars.style.verticalAlign = "middle";
  star2.setAttribute("width", "14");
  star2.setAttribute("height", "14");
  star2.setAttribute("viewBox", "0 0 512 512");
  star2.setAttribute("xml:space", "preserve");
  star2.style.padding = "0 1px";
  value = value && !isNaN(value) ? parseInt(value) : 0;
  value = Math.max(0, Math.min(value, maxStars));
  for (var i = 1; i <= maxStars; i++) {
    var nextStar = star2.cloneNode(true);
    nextStar.innerHTML = i <= value ? starActive : starInactive;
    stars.appendChild(nextStar);
  }
  element.style.whiteSpace = "nowrap";
  element.style.overflow = "hidden";
  element.style.textOverflow = "ellipsis";
  element.setAttribute("aria-label", value);
  return stars;
}
function traffic(cell, formatterParams, onRendered) {
  var value = this.sanitizeHTML(cell.getValue()) || 0, el = document.createElement("span"), max = formatterParams && formatterParams.max ? formatterParams.max : 100, min = formatterParams && formatterParams.min ? formatterParams.min : 0, colors = formatterParams && typeof formatterParams.color !== "undefined" ? formatterParams.color : ["red", "orange", "green"], color2 = "#666666", percent, percentValue;
  if (isNaN(value) || typeof cell.getValue() === "undefined") {
    return;
  }
  el.classList.add("tabulator-traffic-light");
  percentValue = parseFloat(value) <= max ? parseFloat(value) : max;
  percentValue = parseFloat(percentValue) >= min ? parseFloat(percentValue) : min;
  percent = (max - min) / 100;
  percentValue = Math.round((percentValue - min) / percent);
  switch (typeof colors) {
    case "string":
      color2 = colors;
      break;
    case "function":
      color2 = colors(value);
      break;
    case "object":
      if (Array.isArray(colors)) {
        var unit = 100 / colors.length;
        var index = Math.floor(percentValue / unit);
        index = Math.min(index, colors.length - 1);
        index = Math.max(index, 0);
        color2 = colors[index];
        break;
      }
  }
  el.style.backgroundColor = color2;
  return el;
}
function progress(cell, formatterParams = {}, onRendered) {
  var value = this.sanitizeHTML(cell.getValue()) || 0, element = cell.getElement(), max = formatterParams.max ? formatterParams.max : 100, min = formatterParams.min ? formatterParams.min : 0, legendAlign = formatterParams.legendAlign ? formatterParams.legendAlign : "center", percent, percentValue, color2, legend, legendColor;
  percentValue = parseFloat(value) <= max ? parseFloat(value) : max;
  percentValue = parseFloat(percentValue) >= min ? parseFloat(percentValue) : min;
  percent = (max - min) / 100;
  percentValue = Math.round((percentValue - min) / percent);
  switch (typeof formatterParams.color) {
    case "string":
      color2 = formatterParams.color;
      break;
    case "function":
      color2 = formatterParams.color(value);
      break;
    case "object":
      if (Array.isArray(formatterParams.color)) {
        let unit = 100 / formatterParams.color.length;
        let index = Math.floor(percentValue / unit);
        index = Math.min(index, formatterParams.color.length - 1);
        index = Math.max(index, 0);
        color2 = formatterParams.color[index];
        break;
      }
    default:
      color2 = "#2DC214";
  }
  switch (typeof formatterParams.legend) {
    case "string":
      legend = formatterParams.legend;
      break;
    case "function":
      legend = formatterParams.legend(value);
      break;
    case "boolean":
      legend = value;
      break;
    default:
      legend = false;
  }
  switch (typeof formatterParams.legendColor) {
    case "string":
      legendColor = formatterParams.legendColor;
      break;
    case "function":
      legendColor = formatterParams.legendColor(value);
      break;
    case "object":
      if (Array.isArray(formatterParams.legendColor)) {
        let unit = 100 / formatterParams.legendColor.length;
        let index = Math.floor(percentValue / unit);
        index = Math.min(index, formatterParams.legendColor.length - 1);
        index = Math.max(index, 0);
        legendColor = formatterParams.legendColor[index];
      }
      break;
    default:
      legendColor = "#000";
  }
  element.style.minWidth = "30px";
  element.style.position = "relative";
  element.setAttribute("aria-label", percentValue);
  var barEl = document.createElement("div");
  barEl.style.display = "inline-block";
  barEl.style.width = percentValue + "%";
  barEl.style.backgroundColor = color2;
  barEl.style.height = "100%";
  barEl.setAttribute("data-max", max);
  barEl.setAttribute("data-min", min);
  var barContainer = document.createElement("div");
  barContainer.style.position = "relative";
  barContainer.style.width = "100%";
  barContainer.style.height = "100%";
  if (legend) {
    var legendEl = document.createElement("div");
    legendEl.style.position = "absolute";
    legendEl.style.top = 0;
    legendEl.style.left = 0;
    legendEl.style.textAlign = legendAlign;
    legendEl.style.width = "100%";
    legendEl.style.color = legendColor;
    legendEl.innerHTML = legend;
  }
  onRendered(function() {
    if (!(cell instanceof CellComponent)) {
      var holderEl = document.createElement("div");
      holderEl.style.position = "absolute";
      holderEl.style.top = "4px";
      holderEl.style.bottom = "4px";
      holderEl.style.left = "4px";
      holderEl.style.right = "4px";
      element.appendChild(holderEl);
      element = holderEl;
    }
    element.appendChild(barContainer);
    barContainer.appendChild(barEl);
    if (legend) {
      barContainer.appendChild(legendEl);
    }
  });
  return "";
}
function color(cell, formatterParams, onRendered) {
  cell.getElement().style.backgroundColor = this.sanitizeHTML(cell.getValue());
  return "";
}
function buttonTick(cell, formatterParams, onRendered) {
  return '<svg enable-background="new 0 0 24 24" height="14" width="14" viewBox="0 0 24 24" xml:space="preserve" ><path fill="#2DC214" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z" fill-rule="evenodd"/></svg>';
}
function buttonCross(cell, formatterParams, onRendered) {
  return '<svg enable-background="new 0 0 24 24" height="14" width="14" viewBox="0 0 24 24" xml:space="preserve" ><path fill="#CE1515" d="M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272  c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0  l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269  c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73  L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z"/></svg>';
}
function toggle(cell, formatterParams, onRendered) {
  var value = cell.getValue(), size = formatterParams.size || 15, sizePx = size + "px", containEl, switchEl, onValue = formatterParams.hasOwnProperty("onValue") ? formatterParams.onValue : true, offValue = formatterParams.hasOwnProperty("offValue") ? formatterParams.offValue : false, state = formatterParams.onTruthy ? value : value === onValue;
  containEl = document.createElement("div");
  containEl.classList.add("tabulator-toggle");
  if (state) {
    containEl.classList.add("tabulator-toggle-on");
    containEl.style.flexDirection = "row-reverse";
    if (formatterParams.onColor) {
      containEl.style.background = formatterParams.onColor;
    }
  } else {
    if (formatterParams.offColor) {
      containEl.style.background = formatterParams.offColor;
    }
  }
  containEl.style.width = 2.5 * size + "px";
  containEl.style.borderRadius = sizePx;
  if (formatterParams.clickable) {
    containEl.addEventListener("click", (e) => {
      cell.setValue(state ? offValue : onValue);
    });
  }
  switchEl = document.createElement("div");
  switchEl.classList.add("tabulator-toggle-switch");
  switchEl.style.height = sizePx;
  switchEl.style.width = sizePx;
  switchEl.style.borderRadius = sizePx;
  containEl.appendChild(switchEl);
  return containEl;
}
function rownum(cell, formatterParams, onRendered) {
  var content = document.createElement("span");
  var row = cell.getRow();
  var table = cell.getTable();
  row.watchPosition((position) => {
    if (formatterParams.relativeToPage) {
      position += table.modules.page.getPageSize() * (table.modules.page.getPage() - 1);
    }
    content.innerText = position;
  });
  return content;
}
function handle(cell, formatterParams, onRendered) {
  cell.getElement().classList.add("tabulator-row-handle");
  return "<div class='tabulator-row-handle-box'><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div></div>";
}
function adaptable(cell, params, onRendered) {
  var lookup2, formatterFunc, formatterParams;
  function defaultLookup(cell2) {
    var value = cell2.getValue(), formatter = "plaintext";
    switch (typeof value) {
      case "boolean":
        formatter = "tickCross";
        break;
      case "string":
        if (value.includes("\n")) {
          formatter = "textarea";
        }
        break;
    }
    return formatter;
  }
  lookup2 = params.formatterLookup ? params.formatterLookup(cell) : defaultLookup(cell);
  if (params.paramsLookup) {
    formatterParams = typeof params.paramsLookup === "function" ? params.paramsLookup(lookup2, cell) : params.paramsLookup[lookup2];
  }
  formatterFunc = this.table.modules.format.lookupFormatter(lookup2);
  return formatterFunc.call(this, cell, formatterParams || {}, onRendered);
}
function array$2(cell, formatterParams, onRendered) {
  var delimiter = formatterParams.delimiter || ",", value = cell.getValue(), table = this.table, valueMap;
  if (formatterParams.valueMap) {
    if (typeof formatterParams.valueMap === "string") {
      valueMap = function(value2) {
        return value2.map((item) => {
          return Helpers.retrieveNestedData(table.options.nestedFieldSeparator, formatterParams.valueMap, item);
        });
      };
    } else {
      valueMap = formatterParams.valueMap;
    }
  }
  if (Array.isArray(value)) {
    if (valueMap) {
      value = valueMap(value);
    }
    return value.join(delimiter);
  } else {
    return value;
  }
}
function json$1(cell, formatterParams, onRendered) {
  var indent = formatterParams.indent || "	", multiline = typeof formatterParams.multiline === "undefined" ? true : formatterParams.multiline, replacer = formatterParams.replacer || null, value = cell.getValue();
  if (multiline) {
    cell.getElement().style.whiteSpace = "pre-wrap";
  }
  return JSON.stringify(value, replacer, indent);
}
var defaultFormatters = {
  plaintext,
  html,
  textarea,
  money,
  link,
  image,
  tickCross,
  datetime: datetime$1,
  datetimediff,
  lookup,
  star,
  traffic,
  progress,
  color,
  buttonTick,
  buttonCross,
  toggle,
  rownum,
  handle,
  adaptable,
  array: array$2,
  json: json$1
};
class Format extends Module {
  static moduleName = "format";
  //load defaults
  static formatters = defaultFormatters;
  constructor(table) {
    super(table);
    this.registerColumnOption("formatter");
    this.registerColumnOption("formatterParams");
    this.registerColumnOption("formatterPrint");
    this.registerColumnOption("formatterPrintParams");
    this.registerColumnOption("formatterClipboard");
    this.registerColumnOption("formatterClipboardParams");
    this.registerColumnOption("formatterHtmlOutput");
    this.registerColumnOption("formatterHtmlOutputParams");
    this.registerColumnOption("titleFormatter");
    this.registerColumnOption("titleFormatterParams");
  }
  initialize() {
    this.subscribe("cell-format", this.formatValue.bind(this));
    this.subscribe("cell-rendered", this.cellRendered.bind(this));
    this.subscribe("column-layout", this.initializeColumn.bind(this));
    this.subscribe("column-format", this.formatHeader.bind(this));
  }
  //initialize column formatter
  initializeColumn(column) {
    column.modules.format = this.lookupTypeFormatter(column, "");
    if (typeof column.definition.formatterPrint !== "undefined") {
      column.modules.format.print = this.lookupTypeFormatter(column, "Print");
    }
    if (typeof column.definition.formatterClipboard !== "undefined") {
      column.modules.format.clipboard = this.lookupTypeFormatter(column, "Clipboard");
    }
    if (typeof column.definition.formatterHtmlOutput !== "undefined") {
      column.modules.format.htmlOutput = this.lookupTypeFormatter(column, "HtmlOutput");
    }
  }
  lookupTypeFormatter(column, type) {
    var config = { params: column.definition["formatter" + type + "Params"] || {} }, formatter = column.definition["formatter" + type];
    config.formatter = this.lookupFormatter(formatter);
    return config;
  }
  lookupFormatter(formatter) {
    var formatterFunc;
    switch (typeof formatter) {
      case "string":
        if (Format.formatters[formatter]) {
          formatterFunc = Format.formatters[formatter];
        } else {
          console.warn("Formatter Error - No such formatter found: ", formatter);
          formatterFunc = Format.formatters.plaintext;
        }
        break;
      case "function":
        formatterFunc = formatter;
        break;
      default:
        formatterFunc = Format.formatters.plaintext;
        break;
    }
    return formatterFunc;
  }
  cellRendered(cell) {
    if (cell.modules.format && cell.modules.format.renderedCallback && !cell.modules.format.rendered) {
      cell.modules.format.renderedCallback();
      cell.modules.format.rendered = true;
    }
  }
  //return a formatted value for a column header
  formatHeader(column, title, el) {
    var formatter, params, onRendered, mockCell;
    if (column.definition.titleFormatter) {
      formatter = this.lookupFormatter(column.definition.titleFormatter);
      onRendered = (callback) => {
        column.titleFormatterRendered = callback;
      };
      mockCell = {
        getValue: function() {
          return title;
        },
        getElement: function() {
          return el;
        },
        getType: function() {
          return "header";
        },
        getColumn: function() {
          return column.getComponent();
        },
        getTable: () => {
          return this.table;
        }
      };
      params = column.definition.titleFormatterParams || {};
      params = typeof params === "function" ? params() : params;
      return formatter.call(this, mockCell, params, onRendered);
    } else {
      return title;
    }
  }
  //return a formatted value for a cell
  formatValue(cell) {
    var component = cell.getComponent(), params = typeof cell.column.modules.format.params === "function" ? cell.column.modules.format.params(component) : cell.column.modules.format.params;
    function onRendered(callback) {
      if (!cell.modules.format) {
        cell.modules.format = {};
      }
      cell.modules.format.renderedCallback = callback;
      cell.modules.format.rendered = false;
    }
    return cell.column.modules.format.formatter.call(this, component, params, onRendered);
  }
  formatExportValue(cell, type) {
    var formatter = cell.column.modules.format[type], params;
    if (formatter) {
      let onRendered2 = function(callback) {
        if (!cell.modules.format) {
          cell.modules.format = {};
        }
        cell.modules.format.renderedCallback = callback;
        cell.modules.format.rendered = false;
      };
      var onRendered = onRendered2;
      params = typeof formatter.params === "function" ? formatter.params(cell.getComponent()) : formatter.params;
      return formatter.formatter.call(this, cell.getComponent(), params, onRendered2);
    } else {
      return this.formatValue(cell);
    }
  }
  sanitizeHTML(value) {
    if (value) {
      var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;"
      };
      return String(value).replace(/[&<>"'`=/]/g, function(s2) {
        return entityMap[s2];
      });
    } else {
      return value;
    }
  }
  emptyToSpace(value) {
    return value === null || typeof value === "undefined" || value === "" ? "&nbsp;" : value;
  }
}
class Interaction extends Module {
  static moduleName = "interaction";
  constructor(table) {
    super(table);
    this.eventMap = {
      //row events
      rowClick: "row-click",
      rowDblClick: "row-dblclick",
      rowContext: "row-contextmenu",
      rowMouseEnter: "row-mouseenter",
      rowMouseLeave: "row-mouseleave",
      rowMouseOver: "row-mouseover",
      rowMouseOut: "row-mouseout",
      rowMouseMove: "row-mousemove",
      rowMouseDown: "row-mousedown",
      rowMouseUp: "row-mouseup",
      rowTap: "row",
      rowDblTap: "row",
      rowTapHold: "row",
      //cell events
      cellClick: "cell-click",
      cellDblClick: "cell-dblclick",
      cellContext: "cell-contextmenu",
      cellMouseEnter: "cell-mouseenter",
      cellMouseLeave: "cell-mouseleave",
      cellMouseOver: "cell-mouseover",
      cellMouseOut: "cell-mouseout",
      cellMouseMove: "cell-mousemove",
      cellMouseDown: "cell-mousedown",
      cellMouseUp: "cell-mouseup",
      cellTap: "cell",
      cellDblTap: "cell",
      cellTapHold: "cell",
      //column header events
      headerClick: "column-click",
      headerDblClick: "column-dblclick",
      headerContext: "column-contextmenu",
      headerMouseEnter: "column-mouseenter",
      headerMouseLeave: "column-mouseleave",
      headerMouseOver: "column-mouseover",
      headerMouseOut: "column-mouseout",
      headerMouseMove: "column-mousemove",
      headerMouseDown: "column-mousedown",
      headerMouseUp: "column-mouseup",
      headerTap: "column",
      headerDblTap: "column",
      headerTapHold: "column",
      //group header
      groupClick: "group-click",
      groupDblClick: "group-dblclick",
      groupContext: "group-contextmenu",
      groupMouseEnter: "group-mouseenter",
      groupMouseLeave: "group-mouseleave",
      groupMouseOver: "group-mouseover",
      groupMouseOut: "group-mouseout",
      groupMouseMove: "group-mousemove",
      groupMouseDown: "group-mousedown",
      groupMouseUp: "group-mouseup",
      groupTap: "group",
      groupDblTap: "group",
      groupTapHold: "group"
    };
    this.subscribers = {};
    this.touchSubscribers = {};
    this.columnSubscribers = {};
    this.touchWatchers = {
      row: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      cell: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      column: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      group: {
        tap: null,
        tapDbl: null,
        tapHold: null
      }
    };
    this.registerColumnOption("headerClick");
    this.registerColumnOption("headerDblClick");
    this.registerColumnOption("headerContext");
    this.registerColumnOption("headerMouseEnter");
    this.registerColumnOption("headerMouseLeave");
    this.registerColumnOption("headerMouseOver");
    this.registerColumnOption("headerMouseOut");
    this.registerColumnOption("headerMouseMove");
    this.registerColumnOption("headerMouseDown");
    this.registerColumnOption("headerMouseUp");
    this.registerColumnOption("headerTap");
    this.registerColumnOption("headerDblTap");
    this.registerColumnOption("headerTapHold");
    this.registerColumnOption("cellClick");
    this.registerColumnOption("cellDblClick");
    this.registerColumnOption("cellContext");
    this.registerColumnOption("cellMouseEnter");
    this.registerColumnOption("cellMouseLeave");
    this.registerColumnOption("cellMouseOver");
    this.registerColumnOption("cellMouseOut");
    this.registerColumnOption("cellMouseMove");
    this.registerColumnOption("cellMouseDown");
    this.registerColumnOption("cellMouseUp");
    this.registerColumnOption("cellTap");
    this.registerColumnOption("cellDblTap");
    this.registerColumnOption("cellTapHold");
  }
  initialize() {
    this.initializeExternalEvents();
    this.subscribe("column-init", this.initializeColumn.bind(this));
    this.subscribe("cell-dblclick", this.cellContentsSelectionFixer.bind(this));
    this.subscribe("scroll-horizontal", this.clearTouchWatchers.bind(this));
    this.subscribe("scroll-vertical", this.clearTouchWatchers.bind(this));
  }
  clearTouchWatchers() {
    var types = Object.values(this.touchWatchers);
    types.forEach((type) => {
      for (let key in type) {
        type[key] = null;
      }
    });
  }
  cellContentsSelectionFixer(e, cell) {
    var range;
    if (this.table.modExists("edit")) {
      if (this.table.modules.edit.currentCell === cell) {
        return;
      }
    }
    e.preventDefault();
    try {
      if (document.selection) {
        range = document.body.createTextRange();
        range.moveToElementText(cell.getElement());
        range.select();
      } else if (window.getSelection) {
        range = document.createRange();
        range.selectNode(cell.getElement());
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    } catch (e2) {
    }
  }
  initializeExternalEvents() {
    for (let key in this.eventMap) {
      this.subscriptionChangeExternal(key, this.subscriptionChanged.bind(this, key));
    }
  }
  subscriptionChanged(key, added) {
    if (added) {
      if (!this.subscribers[key]) {
        if (this.eventMap[key].includes("-")) {
          this.subscribers[key] = this.handle.bind(this, key);
          this.subscribe(this.eventMap[key], this.subscribers[key]);
        } else {
          this.subscribeTouchEvents(key);
        }
      }
    } else {
      if (this.eventMap[key].includes("-")) {
        if (this.subscribers[key] && !this.columnSubscribers[key] && !this.subscribedExternal(key)) {
          this.unsubscribe(this.eventMap[key], this.subscribers[key]);
          delete this.subscribers[key];
        }
      } else {
        this.unsubscribeTouchEvents(key);
      }
    }
  }
  subscribeTouchEvents(key) {
    var type = this.eventMap[key];
    if (!this.touchSubscribers[type + "-touchstart"]) {
      this.touchSubscribers[type + "-touchstart"] = this.handleTouch.bind(this, type, "start");
      this.touchSubscribers[type + "-touchend"] = this.handleTouch.bind(this, type, "end");
      this.subscribe(type + "-touchstart", this.touchSubscribers[type + "-touchstart"]);
      this.subscribe(type + "-touchend", this.touchSubscribers[type + "-touchend"]);
    }
    this.subscribers[key] = true;
  }
  unsubscribeTouchEvents(key) {
    var noTouch = true, type = this.eventMap[key];
    if (this.subscribers[key] && !this.subscribedExternal(key)) {
      delete this.subscribers[key];
      for (let i in this.eventMap) {
        if (this.eventMap[i] === type) {
          if (this.subscribers[i]) {
            noTouch = false;
          }
        }
      }
      if (noTouch) {
        this.unsubscribe(type + "-touchstart", this.touchSubscribers[type + "-touchstart"]);
        this.unsubscribe(type + "-touchend", this.touchSubscribers[type + "-touchend"]);
        delete this.touchSubscribers[type + "-touchstart"];
        delete this.touchSubscribers[type + "-touchend"];
      }
    }
  }
  initializeColumn(column) {
    var def = column.definition;
    for (let key in this.eventMap) {
      if (def[key]) {
        this.subscriptionChanged(key, true);
        if (!this.columnSubscribers[key]) {
          this.columnSubscribers[key] = [];
        }
        this.columnSubscribers[key].push(column);
      }
    }
  }
  handle(action, e, component) {
    this.dispatchEvent(action, e, component);
  }
  handleTouch(type, action, e, component) {
    var watchers = this.touchWatchers[type];
    if (type === "column") {
      type = "header";
    }
    switch (action) {
      case "start":
        watchers.tap = true;
        clearTimeout(watchers.tapHold);
        watchers.tapHold = setTimeout(() => {
          clearTimeout(watchers.tapHold);
          watchers.tapHold = null;
          watchers.tap = null;
          clearTimeout(watchers.tapDbl);
          watchers.tapDbl = null;
          this.dispatchEvent(type + "TapHold", e, component);
        }, 1e3);
        break;
      case "end":
        if (watchers.tap) {
          watchers.tap = null;
          this.dispatchEvent(type + "Tap", e, component);
        }
        if (watchers.tapDbl) {
          clearTimeout(watchers.tapDbl);
          watchers.tapDbl = null;
          this.dispatchEvent(type + "DblTap", e, component);
        } else {
          watchers.tapDbl = setTimeout(() => {
            clearTimeout(watchers.tapDbl);
            watchers.tapDbl = null;
          }, 300);
        }
        clearTimeout(watchers.tapHold);
        watchers.tapHold = null;
        break;
    }
  }
  dispatchEvent(action, e, component) {
    var componentObj = component.getComponent(), callback;
    if (this.columnSubscribers[action]) {
      if (component instanceof Cell) {
        callback = component.column.definition[action];
      } else if (component instanceof Column) {
        callback = component.definition[action];
      }
      if (callback) {
        callback(e, componentObj);
      }
    }
    this.dispatchExternal(action, e, componentObj);
  }
}
function rows(pageSize, currentRow, currentPage, totalRows, totalPages) {
  var el = document.createElement("span"), showingEl = document.createElement("span"), valueEl = document.createElement("span"), ofEl = document.createElement("span"), totalEl = document.createElement("span"), rowsEl = document.createElement("span");
  this.table.modules.localize.langBind("pagination|counter|showing", (value) => {
    showingEl.innerHTML = value;
  });
  this.table.modules.localize.langBind("pagination|counter|of", (value) => {
    ofEl.innerHTML = value;
  });
  this.table.modules.localize.langBind("pagination|counter|rows", (value) => {
    rowsEl.innerHTML = value;
  });
  if (totalRows) {
    valueEl.innerHTML = " " + currentRow + "-" + Math.min(currentRow + pageSize - 1, totalRows) + " ";
    totalEl.innerHTML = " " + totalRows + " ";
    el.appendChild(showingEl);
    el.appendChild(valueEl);
    el.appendChild(ofEl);
    el.appendChild(totalEl);
    el.appendChild(rowsEl);
  } else {
    valueEl.innerHTML = " 0 ";
    el.appendChild(showingEl);
    el.appendChild(valueEl);
    el.appendChild(rowsEl);
  }
  return el;
}
function pages(pageSize, currentRow, currentPage, totalRows, totalPages) {
  var el = document.createElement("span"), showingEl = document.createElement("span"), valueEl = document.createElement("span"), ofEl = document.createElement("span"), totalEl = document.createElement("span"), rowsEl = document.createElement("span");
  this.table.modules.localize.langBind("pagination|counter|showing", (value) => {
    showingEl.innerHTML = value;
  });
  valueEl.innerHTML = " " + currentPage + " ";
  this.table.modules.localize.langBind("pagination|counter|of", (value) => {
    ofEl.innerHTML = value;
  });
  totalEl.innerHTML = " " + totalPages + " ";
  this.table.modules.localize.langBind("pagination|counter|pages", (value) => {
    rowsEl.innerHTML = value;
  });
  el.appendChild(showingEl);
  el.appendChild(valueEl);
  el.appendChild(ofEl);
  el.appendChild(totalEl);
  el.appendChild(rowsEl);
  return el;
}
var defaultPageCounters = {
  rows,
  pages
};
class Page extends Module {
  static moduleName = "page";
  //load defaults
  static pageCounters = defaultPageCounters;
  constructor(table) {
    super(table);
    this.mode = "local";
    this.progressiveLoad = false;
    this.element = null;
    this.pageCounterElement = null;
    this.pageCounter = null;
    this.size = 0;
    this.page = 1;
    this.count = 5;
    this.max = 1;
    this.remoteRowCountEstimate = null;
    this.initialLoad = true;
    this.dataChanging = false;
    this.pageSizes = [];
    this.registerTableOption("pagination", false);
    this.registerTableOption("paginationMode", "local");
    this.registerTableOption("paginationSize", false);
    this.registerTableOption("paginationInitialPage", 1);
    this.registerTableOption("paginationCounter", false);
    this.registerTableOption("paginationCounterElement", false);
    this.registerTableOption("paginationButtonCount", 5);
    this.registerTableOption("paginationSizeSelector", false);
    this.registerTableOption("paginationElement", false);
    this.registerTableOption("paginationAddRow", "page");
    this.registerTableOption("paginationOutOfRange", false);
    this.registerTableOption("progressiveLoad", false);
    this.registerTableOption("progressiveLoadDelay", 0);
    this.registerTableOption("progressiveLoadScrollMargin", 0);
    this.registerTableFunction("setMaxPage", this.setMaxPage.bind(this));
    this.registerTableFunction("setPage", this.setPage.bind(this));
    this.registerTableFunction("setPageToRow", this.userSetPageToRow.bind(this));
    this.registerTableFunction("setPageSize", this.userSetPageSize.bind(this));
    this.registerTableFunction("getPageSize", this.getPageSize.bind(this));
    this.registerTableFunction("previousPage", this.previousPage.bind(this));
    this.registerTableFunction("nextPage", this.nextPage.bind(this));
    this.registerTableFunction("getPage", this.getPage.bind(this));
    this.registerTableFunction("getPageMax", this.getPageMax.bind(this));
    this.registerComponentFunction("row", "pageTo", this.setPageToRow.bind(this));
  }
  initialize() {
    if (this.table.options.pagination) {
      this.subscribe("row-deleted", this.rowsUpdated.bind(this));
      this.subscribe("row-added", this.rowsUpdated.bind(this));
      this.subscribe("data-processed", this.initialLoadComplete.bind(this));
      this.subscribe("table-built", this.calculatePageSizes.bind(this));
      this.subscribe("footer-redraw", this.footerRedraw.bind(this));
      if (this.table.options.paginationAddRow == "page") {
        this.subscribe("row-adding-position", this.rowAddingPosition.bind(this));
      }
      if (this.table.options.paginationMode === "remote") {
        this.subscribe("data-params", this.remotePageParams.bind(this));
        this.subscribe("data-loaded", this._parseRemoteData.bind(this));
      }
      if (this.table.options.progressiveLoad) {
        console.error("Progressive Load Error - Pagination and progressive load cannot be used at the same time");
      }
      this.registerDisplayHandler(this.restOnRenderBefore.bind(this), 40);
      this.registerDisplayHandler(this.getRows.bind(this), 50);
      this.createElements();
      this.initializePageCounter();
      this.initializePaginator();
    } else if (this.table.options.progressiveLoad) {
      this.subscribe("data-params", this.remotePageParams.bind(this));
      this.subscribe("data-loaded", this._parseRemoteData.bind(this));
      this.subscribe("table-built", this.calculatePageSizes.bind(this));
      this.subscribe("data-processed", this.initialLoadComplete.bind(this));
      this.initializeProgressive(this.table.options.progressiveLoad);
      if (this.table.options.progressiveLoad === "scroll") {
        this.subscribe("scroll-vertical", this.scrollVertical.bind(this));
      }
    }
  }
  rowAddingPosition(row, top) {
    var rowManager = this.table.rowManager, displayRows = rowManager.getDisplayRows(), index;
    if (top) {
      if (displayRows.length) {
        index = displayRows[0];
      } else {
        if (rowManager.activeRows.length) {
          index = rowManager.activeRows[rowManager.activeRows.length - 1];
          top = false;
        }
      }
    } else {
      if (displayRows.length) {
        index = displayRows[displayRows.length - 1];
        top = displayRows.length < this.size ? false : true;
      }
    }
    return { index, top };
  }
  calculatePageSizes() {
    var testElRow, testElCell;
    if (this.table.options.paginationSize) {
      this.size = this.table.options.paginationSize;
    } else {
      testElRow = document.createElement("div");
      testElRow.classList.add("tabulator-row");
      testElRow.style.visibility = "hidden";
      testElCell = document.createElement("div");
      testElCell.classList.add("tabulator-cell");
      testElCell.innerHTML = "Page Row Test";
      testElRow.appendChild(testElCell);
      this.table.rowManager.getTableElement().appendChild(testElRow);
      this.size = Math.floor(this.table.rowManager.getElement().clientHeight / testElRow.offsetHeight);
      this.table.rowManager.getTableElement().removeChild(testElRow);
    }
    this.dispatchExternal("pageSizeChanged", this.size);
    this.generatePageSizeSelectList();
  }
  initialLoadComplete() {
    this.initialLoad = false;
  }
  remotePageParams(data, config, silent, params) {
    if (!this.initialLoad) {
      if (this.progressiveLoad && !silent || !this.progressiveLoad && !this.dataChanging) {
        this.reset(true);
      }
    }
    params.page = this.page;
    if (this.size) {
      params.size = this.size;
    }
    return params;
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  userSetPageToRow(row) {
    if (this.table.options.pagination) {
      row = this.table.rowManager.findRow(row);
      if (row) {
        return this.setPageToRow(row);
      }
    }
    return Promise.reject();
  }
  userSetPageSize(size) {
    if (this.table.options.pagination) {
      this.setPageSize(size);
      return this.setPage(1);
    } else {
      return false;
    }
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  scrollVertical(top, dir) {
    var element, diff2, margin;
    if (!dir && !this.table.dataLoader.loading) {
      element = this.table.rowManager.getElement();
      diff2 = element.scrollHeight - element.clientHeight - top;
      margin = this.table.options.progressiveLoadScrollMargin || element.clientHeight * 2;
      if (diff2 < margin) {
        this.nextPage().catch(() => {
        });
      }
    }
  }
  restOnRenderBefore(rows2, renderInPosition) {
    if (!renderInPosition) {
      if (this.mode === "local") {
        this.reset();
      }
    }
    return rows2;
  }
  rowsUpdated() {
    this.refreshData(true, "all");
  }
  createElements() {
    var button;
    this.element = document.createElement("span");
    this.element.classList.add("tabulator-paginator");
    this.pagesElement = document.createElement("span");
    this.pagesElement.classList.add("tabulator-pages");
    button = document.createElement("button");
    button.classList.add("tabulator-page");
    button.setAttribute("type", "button");
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", "");
    button.setAttribute("title", "");
    this.firstBut = button.cloneNode(true);
    this.firstBut.setAttribute("data-page", "first");
    this.prevBut = button.cloneNode(true);
    this.prevBut.setAttribute("data-page", "prev");
    this.nextBut = button.cloneNode(true);
    this.nextBut.setAttribute("data-page", "next");
    this.lastBut = button.cloneNode(true);
    this.lastBut.setAttribute("data-page", "last");
    if (this.table.options.paginationSizeSelector) {
      this.pageSizeSelect = document.createElement("select");
      this.pageSizeSelect.classList.add("tabulator-page-size");
    }
  }
  generatePageSizeSelectList() {
    var pageSizes = [];
    if (this.pageSizeSelect) {
      if (Array.isArray(this.table.options.paginationSizeSelector)) {
        pageSizes = this.table.options.paginationSizeSelector;
        this.pageSizes = pageSizes;
        if (this.pageSizes.indexOf(this.size) == -1) {
          pageSizes.unshift(this.size);
        }
      } else {
        if (this.pageSizes.indexOf(this.size) == -1) {
          pageSizes = [];
          for (let i = 1; i < 5; i++) {
            pageSizes.push(this.size * i);
          }
          this.pageSizes = pageSizes;
        } else {
          pageSizes = this.pageSizes;
        }
      }
      while (this.pageSizeSelect.firstChild) this.pageSizeSelect.removeChild(this.pageSizeSelect.firstChild);
      pageSizes.forEach((item) => {
        var itemEl = document.createElement("option");
        itemEl.value = item;
        if (item === true) {
          this.langBind("pagination|all", function(value) {
            itemEl.innerHTML = value;
          });
        } else {
          itemEl.innerHTML = item;
        }
        this.pageSizeSelect.appendChild(itemEl);
      });
      this.pageSizeSelect.value = this.size;
    }
  }
  initializePageCounter() {
    var counter = this.table.options.paginationCounter, pageCounter = null;
    if (counter) {
      if (typeof counter === "function") {
        pageCounter = counter;
      } else {
        pageCounter = Page.pageCounters[counter];
      }
      if (pageCounter) {
        this.pageCounter = pageCounter;
        this.pageCounterElement = document.createElement("span");
        this.pageCounterElement.classList.add("tabulator-page-counter");
      } else {
        console.warn("Pagination Error - No such page counter found: ", counter);
      }
    }
  }
  //setup pagination
  initializePaginator(hidden) {
    var pageSelectLabel, paginationCounterHolder;
    if (!hidden) {
      this.langBind("pagination|first", (value) => {
        this.firstBut.innerHTML = value;
      });
      this.langBind("pagination|first_title", (value) => {
        this.firstBut.setAttribute("aria-label", value);
        this.firstBut.setAttribute("title", value);
      });
      this.langBind("pagination|prev", (value) => {
        this.prevBut.innerHTML = value;
      });
      this.langBind("pagination|prev_title", (value) => {
        this.prevBut.setAttribute("aria-label", value);
        this.prevBut.setAttribute("title", value);
      });
      this.langBind("pagination|next", (value) => {
        this.nextBut.innerHTML = value;
      });
      this.langBind("pagination|next_title", (value) => {
        this.nextBut.setAttribute("aria-label", value);
        this.nextBut.setAttribute("title", value);
      });
      this.langBind("pagination|last", (value) => {
        this.lastBut.innerHTML = value;
      });
      this.langBind("pagination|last_title", (value) => {
        this.lastBut.setAttribute("aria-label", value);
        this.lastBut.setAttribute("title", value);
      });
      this.firstBut.addEventListener("click", () => {
        this.setPage(1);
      });
      this.prevBut.addEventListener("click", () => {
        this.previousPage();
      });
      this.nextBut.addEventListener("click", () => {
        this.nextPage();
      });
      this.lastBut.addEventListener("click", () => {
        this.setPage(this.max);
      });
      if (this.table.options.paginationElement) {
        this.element = this.table.options.paginationElement;
      }
      if (this.pageSizeSelect) {
        pageSelectLabel = document.createElement("label");
        this.langBind("pagination|page_size", (value) => {
          this.pageSizeSelect.setAttribute("aria-label", value);
          this.pageSizeSelect.setAttribute("title", value);
          pageSelectLabel.innerHTML = value;
        });
        this.element.appendChild(pageSelectLabel);
        this.element.appendChild(this.pageSizeSelect);
        this.pageSizeSelect.addEventListener("change", (e) => {
          this.setPageSize(this.pageSizeSelect.value == "true" ? true : this.pageSizeSelect.value);
          this.setPage(1);
        });
      }
      this.element.appendChild(this.firstBut);
      this.element.appendChild(this.prevBut);
      this.element.appendChild(this.pagesElement);
      this.element.appendChild(this.nextBut);
      this.element.appendChild(this.lastBut);
      if (!this.table.options.paginationElement) {
        if (this.table.options.paginationCounter) {
          if (this.table.options.paginationCounterElement) {
            if (this.table.options.paginationCounterElement instanceof HTMLElement) {
              this.table.options.paginationCounterElement.appendChild(this.pageCounterElement);
            } else if (typeof this.table.options.paginationCounterElement === "string") {
              paginationCounterHolder = document.querySelector(this.table.options.paginationCounterElement);
              if (paginationCounterHolder) {
                paginationCounterHolder.appendChild(this.pageCounterElement);
              } else {
                console.warn("Pagination Error - Unable to find element matching paginationCounterElement selector:", this.table.options.paginationCounterElement);
              }
            }
          } else {
            this.footerAppend(this.pageCounterElement);
          }
        }
        this.footerAppend(this.element);
      }
      this.page = this.table.options.paginationInitialPage;
      this.count = this.table.options.paginationButtonCount;
    }
    this.mode = this.table.options.paginationMode;
  }
  initializeProgressive(mode) {
    this.initializePaginator(true);
    this.mode = "progressive_" + mode;
    this.progressiveLoad = true;
  }
  trackChanges() {
    this.dispatch("page-changed");
  }
  //calculate maximum page from number of rows
  setMaxRows(rowCount) {
    if (!rowCount) {
      this.max = 1;
    } else {
      this.max = this.size === true ? 1 : Math.ceil(rowCount / this.size);
    }
    if (this.page > this.max) {
      this.page = this.max;
    }
  }
  //reset to first page without triggering action
  reset(force) {
    if (!this.initialLoad) {
      if (this.mode == "local" || force) {
        this.page = 1;
        this.trackChanges();
      }
    }
  }
  //set the maximum page
  setMaxPage(max) {
    max = parseInt(max);
    this.max = max || 1;
    if (this.page > this.max) {
      this.page = this.max;
      this.trigger();
    }
  }
  //set current page number
  setPage(page) {
    switch (page) {
      case "first":
        return this.setPage(1);
      case "prev":
        return this.previousPage();
      case "next":
        return this.nextPage();
      case "last":
        return this.setPage(this.max);
    }
    page = parseInt(page);
    if (page > 0 && page <= this.max || this.mode !== "local") {
      this.page = page;
      this.trackChanges();
      return this.trigger();
    } else {
      console.warn("Pagination Error - Requested page is out of range of 1 - " + this.max + ":", page);
      return Promise.reject();
    }
  }
  setPageToRow(row) {
    var rows2 = this.displayRows(-1);
    var index = rows2.indexOf(row);
    if (index > -1) {
      var page = this.size === true ? 1 : Math.ceil((index + 1) / this.size);
      return this.setPage(page);
    } else {
      console.warn("Pagination Error - Requested row is not visible");
      return Promise.reject();
    }
  }
  setPageSize(size) {
    if (size !== true) {
      size = parseInt(size);
    }
    if (size > 0) {
      this.size = size;
      this.dispatchExternal("pageSizeChanged", size);
    }
    if (this.pageSizeSelect) {
      this.generatePageSizeSelectList();
    }
    this.trackChanges();
  }
  _setPageCounter(totalRows, size, currentRow) {
    var content;
    if (this.pageCounter) {
      if (this.mode === "remote") {
        size = this.size;
        currentRow = (this.page - 1) * this.size + 1;
        totalRows = this.remoteRowCountEstimate;
      }
      content = this.pageCounter.call(this, size, currentRow, this.page, totalRows, this.max);
      switch (typeof content) {
        case "object":
          if (content instanceof Node) {
            while (this.pageCounterElement.firstChild) this.pageCounterElement.removeChild(this.pageCounterElement.firstChild);
            this.pageCounterElement.appendChild(content);
          } else {
            this.pageCounterElement.innerHTML = "";
            if (content != null) {
              console.warn("Page Counter Error - Page Counter has returned a type of object, the only valid page counter object return is an instance of Node, the page counter returned:", content);
            }
          }
          break;
        case "undefined":
          this.pageCounterElement.innerHTML = "";
          break;
        default:
          this.pageCounterElement.innerHTML = content;
      }
    }
  }
  //setup the pagination buttons
  _setPageButtons() {
    let leftSize = Math.floor((this.count - 1) / 2);
    let rightSize = Math.ceil((this.count - 1) / 2);
    let min = this.max - this.page + leftSize + 1 < this.count ? this.max - this.count + 1 : Math.max(this.page - leftSize, 1);
    let max = this.page <= rightSize ? Math.min(this.count, this.max) : Math.min(this.page + rightSize, this.max);
    while (this.pagesElement.firstChild) this.pagesElement.removeChild(this.pagesElement.firstChild);
    if (this.page == 1) {
      this.firstBut.disabled = true;
      this.prevBut.disabled = true;
    } else {
      this.firstBut.disabled = false;
      this.prevBut.disabled = false;
    }
    if (this.page == this.max) {
      this.lastBut.disabled = true;
      this.nextBut.disabled = true;
    } else {
      this.lastBut.disabled = false;
      this.nextBut.disabled = false;
    }
    for (let i = min; i <= max; i++) {
      if (i > 0 && i <= this.max) {
        this.pagesElement.appendChild(this._generatePageButton(i));
      }
    }
    this.footerRedraw();
  }
  _generatePageButton(page) {
    var button = document.createElement("button");
    button.classList.add("tabulator-page");
    if (page == this.page) {
      button.classList.add("active");
    }
    button.setAttribute("type", "button");
    button.setAttribute("role", "button");
    this.langBind("pagination|page_title", (value) => {
      button.setAttribute("aria-label", value + " " + page);
      button.setAttribute("title", value + " " + page);
    });
    button.setAttribute("data-page", page);
    button.textContent = page;
    button.addEventListener("click", (e) => {
      this.setPage(page);
    });
    return button;
  }
  //previous page
  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.trackChanges();
      return this.trigger();
    } else {
      console.warn("Pagination Error - Previous page would be less than page 1:", 0);
      return Promise.reject();
    }
  }
  //next page
  nextPage() {
    if (this.page < this.max) {
      this.page++;
      this.trackChanges();
      return this.trigger();
    } else {
      if (!this.progressiveLoad) {
        console.warn("Pagination Error - Next page would be greater than maximum page of " + this.max + ":", this.max + 1);
      }
      return Promise.reject();
    }
  }
  //return current page number
  getPage() {
    return this.page;
  }
  //return max page number
  getPageMax() {
    return this.max;
  }
  getPageSize(size) {
    return this.size;
  }
  getMode() {
    return this.mode;
  }
  //return appropriate rows for current page
  getRows(data) {
    var actualRowPageSize = 0, output, start, end, actualStartRow;
    var actualRows = data.filter((row) => {
      return row.type === "row";
    });
    if (this.mode == "local") {
      output = [];
      this.setMaxRows(data.length);
      if (this.size === true) {
        start = 0;
        end = data.length;
      } else {
        start = this.size * (this.page - 1);
        end = start + parseInt(this.size);
      }
      this._setPageButtons();
      for (let i = start; i < end; i++) {
        let row = data[i];
        if (row) {
          output.push(row);
          if (row.type === "row") {
            if (!actualStartRow) {
              actualStartRow = row;
            }
            actualRowPageSize++;
          }
        }
      }
      this._setPageCounter(actualRows.length, actualRowPageSize, actualStartRow ? actualRows.indexOf(actualStartRow) + 1 : 0);
      return output;
    } else {
      this._setPageButtons();
      this._setPageCounter(actualRows.length);
      return data.slice(0);
    }
  }
  trigger() {
    var left;
    switch (this.mode) {
      case "local":
        left = this.table.rowManager.scrollLeft;
        this.refreshData();
        this.table.rowManager.scrollHorizontal(left);
        this.dispatchExternal("pageLoaded", this.getPage());
        return Promise.resolve();
      case "remote":
        this.dataChanging = true;
        return this.reloadData(null).finally(() => {
          this.dataChanging = false;
        });
      case "progressive_load":
      case "progressive_scroll":
        return this.reloadData(null, true);
      default:
        console.warn("Pagination Error - no such pagination mode:", this.mode);
        return Promise.reject();
    }
  }
  _parseRemoteData(data) {
    var margin, paginationOutOfRange;
    if (typeof data.last_page === "undefined") {
      console.warn("Remote Pagination Error - Server response missing '" + (this.options("dataReceiveParams").last_page || "last_page") + "' property");
    }
    if (data.data) {
      this.max = parseInt(data.last_page) || 1;
      this.remoteRowCountEstimate = typeof data.last_row !== "undefined" ? data.last_row : data.last_page * this.size - (this.page == data.last_page ? this.size - data.data.length : 0);
      if (this.progressiveLoad) {
        switch (this.mode) {
          case "progressive_load":
            if (this.page == 1) {
              this.table.rowManager.setData(data.data, false, this.page == 1);
            } else {
              this.table.rowManager.addRows(data.data);
            }
            if (this.page < this.max) {
              setTimeout(() => {
                this.nextPage();
              }, this.table.options.progressiveLoadDelay);
            }
            break;
          case "progressive_scroll":
            data = this.page === 1 ? data.data : this.table.rowManager.getData().concat(data.data);
            this.table.rowManager.setData(data, this.page !== 1, this.page == 1);
            margin = this.table.options.progressiveLoadScrollMargin || this.table.rowManager.element.clientHeight * 2;
            if (this.table.rowManager.element.scrollHeight <= this.table.rowManager.element.clientHeight + margin) {
              if (this.page < this.max) {
                setTimeout(() => {
                  this.nextPage();
                });
              }
            }
            break;
        }
        return false;
      } else {
        if (this.page > this.max) {
          console.warn("Remote Pagination Error - Server returned last page value lower than the current page");
          paginationOutOfRange = this.options("paginationOutOfRange");
          if (paginationOutOfRange) {
            return this.setPage(typeof paginationOutOfRange === "function" ? paginationOutOfRange.call(this, this.page, this.max) : paginationOutOfRange);
          }
        }
        this.dispatchExternal("pageLoaded", this.getPage());
      }
    } else {
      console.warn("Remote Pagination Error - Server response missing '" + (this.options("dataReceiveParams").data || "data") + "' property");
    }
    return data.data;
  }
  //handle the footer element being redrawn
  footerRedraw() {
    var footer = this.table.footerManager.containerElement;
    if (Math.ceil(footer.clientWidth) - footer.scrollWidth < 0) {
      this.pagesElement.style.display = "none";
    } else {
      this.pagesElement.style.display = "";
      if (Math.ceil(footer.clientWidth) - footer.scrollWidth < 0) {
        this.pagesElement.style.display = "none";
      }
    }
  }
}
function number(a, b, aRow, bRow, column, dir, params) {
  var alignEmptyValues = params.alignEmptyValues;
  var decimal = params.decimalSeparator;
  var thousand = params.thousandSeparator;
  var emptyAlign = 0;
  a = String(a);
  b = String(b);
  if (thousand) {
    a = a.split(thousand).join("");
    b = b.split(thousand).join("");
  }
  if (decimal) {
    a = a.split(decimal).join(".");
    b = b.split(decimal).join(".");
  }
  a = parseFloat(a);
  b = parseFloat(b);
  if (isNaN(a)) {
    emptyAlign = isNaN(b) ? 0 : -1;
  } else if (isNaN(b)) {
    emptyAlign = 1;
  } else {
    return a - b;
  }
  if (alignEmptyValues === "top" && dir === "desc" || alignEmptyValues === "bottom" && dir === "asc") {
    emptyAlign *= -1;
  }
  return emptyAlign;
}
function string(a, b, aRow, bRow, column, dir, params) {
  var alignEmptyValues = params.alignEmptyValues;
  var emptyAlign = 0;
  var locale;
  if (!a) {
    emptyAlign = !b ? 0 : -1;
  } else if (!b) {
    emptyAlign = 1;
  } else {
    switch (typeof params.locale) {
      case "boolean":
        if (params.locale) {
          locale = this.langLocale();
        }
        break;
      case "string":
        locale = params.locale;
        break;
    }
    return String(a).toLowerCase().localeCompare(String(b).toLowerCase(), locale);
  }
  if (alignEmptyValues === "top" && dir === "desc" || alignEmptyValues === "bottom" && dir === "asc") {
    emptyAlign *= -1;
  }
  return emptyAlign;
}
function datetime(a, b, aRow, bRow, column, dir, params) {
  var DT = this.table.dependencyRegistry.lookup(["luxon", "DateTime"], "DateTime");
  var format = params.format || "dd/MM/yyyy HH:mm:ss", alignEmptyValues = params.alignEmptyValues, emptyAlign = 0;
  if (typeof DT != "undefined") {
    if (!DT.isDateTime(a)) {
      if (format === "iso") {
        a = DT.fromISO(String(a));
      } else {
        a = DT.fromFormat(String(a), format);
      }
    }
    if (!DT.isDateTime(b)) {
      if (format === "iso") {
        b = DT.fromISO(String(b));
      } else {
        b = DT.fromFormat(String(b), format);
      }
    }
    if (!a.isValid) {
      emptyAlign = !b.isValid ? 0 : -1;
    } else if (!b.isValid) {
      emptyAlign = 1;
    } else {
      return a - b;
    }
    if (alignEmptyValues === "top" && dir === "desc" || alignEmptyValues === "bottom" && dir === "asc") {
      emptyAlign *= -1;
    }
    return emptyAlign;
  } else {
    console.error("Sort Error - 'datetime' sorter is dependant on luxon.js");
  }
}
function date(a, b, aRow, bRow, column, dir, params) {
  if (!params.format) {
    params.format = "dd/MM/yyyy";
  }
  return datetime.call(this, a, b, aRow, bRow, column, dir, params);
}
function time(a, b, aRow, bRow, column, dir, params) {
  if (!params.format) {
    params.format = "HH:mm";
  }
  return datetime.call(this, a, b, aRow, bRow, column, dir, params);
}
function boolean(a, b, aRow, bRow, column, dir, params) {
  var el1 = a === true || a === "true" || a === "True" || a === 1 ? 1 : 0;
  var el2 = b === true || b === "true" || b === "True" || b === 1 ? 1 : 0;
  return el1 - el2;
}
function array(a, b, aRow, bRow, column, dir, params) {
  var type = params.type || "length", alignEmptyValues = params.alignEmptyValues, emptyAlign = 0, table = this.table, valueMap;
  if (params.valueMap) {
    if (typeof params.valueMap === "string") {
      valueMap = function(value) {
        return value.map((item) => {
          return Helpers.retrieveNestedData(table.options.nestedFieldSeparator, params.valueMap, item);
        });
      };
    } else {
      valueMap = params.valueMap;
    }
  }
  function calc(value) {
    var result;
    if (valueMap) {
      value = valueMap(value);
    }
    switch (type) {
      case "length":
        result = value.length;
        break;
      case "sum":
        result = value.reduce(function(c, d) {
          return c + d;
        });
        break;
      case "max":
        result = Math.max.apply(null, value);
        break;
      case "min":
        result = Math.min.apply(null, value);
        break;
      case "avg":
        result = value.reduce(function(c, d) {
          return c + d;
        }) / value.length;
        break;
      case "string":
        result = value.join("");
        break;
    }
    return result;
  }
  if (!Array.isArray(a)) {
    emptyAlign = !Array.isArray(b) ? 0 : -1;
  } else if (!Array.isArray(b)) {
    emptyAlign = 1;
  } else {
    if (type === "string") {
      return String(calc(a)).toLowerCase().localeCompare(String(calc(b)).toLowerCase());
    } else {
      return calc(b) - calc(a);
    }
  }
  if (alignEmptyValues === "top" && dir === "desc" || alignEmptyValues === "bottom" && dir === "asc") {
    emptyAlign *= -1;
  }
  return emptyAlign;
}
function exists(a, b, aRow, bRow, column, dir, params) {
  var el1 = typeof a == "undefined" ? 0 : 1;
  var el2 = typeof b == "undefined" ? 0 : 1;
  return el1 - el2;
}
function alphanum(as, bs, aRow, bRow, column, dir, params) {
  var a, b, a1, b1, i = 0, L, rx = /(\d+)|(\D+)/g, rd = /\d/;
  var alignEmptyValues = params.alignEmptyValues;
  var emptyAlign = 0;
  if (!as && as !== 0) {
    emptyAlign = !bs && bs !== 0 ? 0 : -1;
  } else if (!bs && bs !== 0) {
    emptyAlign = 1;
  } else {
    if (isFinite(as) && isFinite(bs)) return as - bs;
    a = String(as).toLowerCase();
    b = String(bs).toLowerCase();
    if (a === b) return 0;
    if (!(rd.test(a) && rd.test(b))) return a > b ? 1 : -1;
    a = a.match(rx);
    b = b.match(rx);
    L = a.length > b.length ? b.length : a.length;
    while (i < L) {
      a1 = a[i];
      b1 = b[i++];
      if (a1 !== b1) {
        if (isFinite(a1) && isFinite(b1)) {
          if (a1.charAt(0) === "0") a1 = "." + a1;
          if (b1.charAt(0) === "0") b1 = "." + b1;
          return a1 - b1;
        } else return a1 > b1 ? 1 : -1;
      }
    }
    return a.length > b.length;
  }
  if (alignEmptyValues === "top" && dir === "desc" || alignEmptyValues === "bottom" && dir === "asc") {
    emptyAlign *= -1;
  }
  return emptyAlign;
}
var defaultSorters = {
  number,
  string,
  date,
  time,
  datetime,
  boolean,
  array,
  exists,
  alphanum
};
class Sort extends Module {
  static moduleName = "sort";
  //load defaults
  static sorters = defaultSorters;
  constructor(table) {
    super(table);
    this.sortList = [];
    this.changed = false;
    this.registerTableOption("sortMode", "local");
    this.registerTableOption("initialSort", false);
    this.registerTableOption("columnHeaderSortMulti", true);
    this.registerTableOption("sortOrderReverse", false);
    this.registerTableOption("headerSortElement", "<div class='tabulator-arrow'></div>");
    this.registerTableOption("headerSortClickElement", "header");
    this.registerColumnOption("sorter");
    this.registerColumnOption("sorterParams");
    this.registerColumnOption("headerSort", true);
    this.registerColumnOption("headerSortStartingDir");
    this.registerColumnOption("headerSortTristate");
  }
  initialize() {
    this.subscribe("column-layout", this.initializeColumn.bind(this));
    this.subscribe("table-built", this.tableBuilt.bind(this));
    this.registerDataHandler(this.sort.bind(this), 20);
    this.registerTableFunction("setSort", this.userSetSort.bind(this));
    this.registerTableFunction("getSorters", this.getSort.bind(this));
    this.registerTableFunction("clearSort", this.clearSort.bind(this));
    if (this.table.options.sortMode === "remote") {
      this.subscribe("data-params", this.remoteSortParams.bind(this));
    }
  }
  tableBuilt() {
    if (this.table.options.initialSort) {
      this.setSort(this.table.options.initialSort);
    }
  }
  remoteSortParams(data, config, silent, params) {
    var sorters = this.getSort();
    sorters.forEach((item) => {
      delete item.column;
    });
    params.sort = sorters;
    return params;
  }
  ///////////////////////////////////
  ///////// Table Functions /////////
  ///////////////////////////////////
  userSetSort(sortList, dir) {
    this.setSort(sortList, dir);
    this.refreshSort();
  }
  clearSort() {
    this.clear();
    this.refreshSort();
  }
  ///////////////////////////////////
  ///////// Internal Logic //////////
  ///////////////////////////////////
  //initialize column header for sorting
  initializeColumn(column) {
    var sorter = false, colEl, arrowEl;
    switch (typeof column.definition.sorter) {
      case "string":
        if (Sort.sorters[column.definition.sorter]) {
          sorter = Sort.sorters[column.definition.sorter];
        } else {
          console.warn("Sort Error - No such sorter found: ", column.definition.sorter);
        }
        break;
      case "function":
        sorter = column.definition.sorter;
        break;
    }
    column.modules.sort = {
      sorter,
      dir: "none",
      params: column.definition.sorterParams || {},
      startingDir: column.definition.headerSortStartingDir || "asc",
      tristate: column.definition.headerSortTristate
    };
    if (column.definition.headerSort !== false) {
      colEl = column.getElement();
      colEl.classList.add("tabulator-sortable");
      arrowEl = document.createElement("div");
      arrowEl.classList.add("tabulator-col-sorter");
      switch (this.table.options.headerSortClickElement) {
        case "icon":
          arrowEl.classList.add("tabulator-col-sorter-element");
          break;
        case "header":
          colEl.classList.add("tabulator-col-sorter-element");
          break;
        default:
          colEl.classList.add("tabulator-col-sorter-element");
          break;
      }
      switch (this.table.options.headerSortElement) {
        case "function":
          break;
        case "object":
          arrowEl.appendChild(this.table.options.headerSortElement);
          break;
        default:
          arrowEl.innerHTML = this.table.options.headerSortElement;
      }
      column.titleHolderElement.appendChild(arrowEl);
      column.modules.sort.element = arrowEl;
      this.setColumnHeaderSortIcon(column, "none");
      if (this.table.options.headerSortClickElement === "icon") {
        arrowEl.addEventListener("mousedown", (e) => {
          e.stopPropagation();
        });
      }
      (this.table.options.headerSortClickElement === "icon" ? arrowEl : colEl).addEventListener("click", (e) => {
        var dir = "", sorters = [], match2 = false;
        if (column.modules.sort) {
          if (column.modules.sort.tristate) {
            if (column.modules.sort.dir == "none") {
              dir = column.modules.sort.startingDir;
            } else {
              if (column.modules.sort.dir == column.modules.sort.startingDir) {
                dir = column.modules.sort.dir == "asc" ? "desc" : "asc";
              } else {
                dir = "none";
              }
            }
          } else {
            switch (column.modules.sort.dir) {
              case "asc":
                dir = "desc";
                break;
              case "desc":
                dir = "asc";
                break;
              default:
                dir = column.modules.sort.startingDir;
            }
          }
          if (this.table.options.columnHeaderSortMulti && (e.shiftKey || e.ctrlKey)) {
            sorters = this.getSort();
            match2 = sorters.findIndex((sorter2) => {
              return sorter2.field === column.getField();
            });
            if (match2 > -1) {
              sorters[match2].dir = dir;
              match2 = sorters.splice(match2, 1)[0];
              if (dir != "none") {
                sorters.push(match2);
              }
            } else {
              if (dir != "none") {
                sorters.push({ column, dir });
              }
            }
            this.setSort(sorters);
          } else {
            if (dir == "none") {
              this.clear();
            } else {
              this.setSort(column, dir);
            }
          }
          this.refreshSort();
        }
      });
    }
  }
  refreshSort() {
    if (this.table.options.sortMode === "remote") {
      this.reloadData(null, false, false);
    } else {
      this.refreshData(true);
    }
  }
  //check if the sorters have changed since last use
  hasChanged() {
    var changed = this.changed;
    this.changed = false;
    return changed;
  }
  //return current sorters
  getSort() {
    var self = this, sorters = [];
    self.sortList.forEach(function(item) {
      if (item.column) {
        sorters.push({ column: item.column.getComponent(), field: item.column.getField(), dir: item.dir });
      }
    });
    return sorters;
  }
  //change sort list and trigger sort
  setSort(sortList, dir) {
    var self = this, newSortList = [];
    if (!Array.isArray(sortList)) {
      sortList = [{ column: sortList, dir }];
    }
    sortList.forEach(function(item) {
      var column;
      column = self.table.columnManager.findColumn(item.column);
      if (column) {
        item.column = column;
        newSortList.push(item);
        self.changed = true;
      } else {
        console.warn("Sort Warning - Sort field does not exist and is being ignored: ", item.column);
      }
    });
    self.sortList = newSortList;
    this.dispatch("sort-changed");
  }
  //clear sorters
  clear() {
    this.setSort([]);
  }
  //find appropriate sorter for column
  findSorter(column) {
    var row = this.table.rowManager.activeRows[0], sorter = "string", field, value;
    if (row) {
      row = row.getData();
      field = column.getField();
      if (field) {
        value = column.getFieldValue(row);
        switch (typeof value) {
          case "undefined":
            sorter = "string";
            break;
          case "boolean":
            sorter = "boolean";
            break;
          default:
            if (!isNaN(value) && value !== "") {
              sorter = "number";
            } else {
              if (value.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+$/i)) {
                sorter = "alphanum";
              }
            }
            break;
        }
      }
    }
    return Sort.sorters[sorter];
  }
  //work through sort list sorting data
  sort(data, sortOnly) {
    var self = this, sortList = this.table.options.sortOrderReverse ? self.sortList.slice().reverse() : self.sortList, sortListActual = [], rowComponents = [];
    if (this.subscribedExternal("dataSorting")) {
      this.dispatchExternal("dataSorting", self.getSort());
    }
    if (!sortOnly) {
      self.clearColumnHeaders();
    }
    if (this.table.options.sortMode !== "remote") {
      sortList.forEach(function(item, i) {
        var sortObj;
        if (item.column) {
          sortObj = item.column.modules.sort;
          if (sortObj) {
            if (!sortObj.sorter) {
              sortObj.sorter = self.findSorter(item.column);
            }
            item.params = typeof sortObj.params === "function" ? sortObj.params(item.column.getComponent(), item.dir) : sortObj.params;
            sortListActual.push(item);
          }
          if (!sortOnly) {
            self.setColumnHeader(item.column, item.dir);
          }
        }
      });
      if (sortListActual.length) {
        self._sortItems(data, sortListActual);
      }
    } else if (!sortOnly) {
      sortList.forEach(function(item, i) {
        self.setColumnHeader(item.column, item.dir);
      });
    }
    if (this.subscribedExternal("dataSorted")) {
      data.forEach((row) => {
        rowComponents.push(row.getComponent());
      });
      this.dispatchExternal("dataSorted", self.getSort(), rowComponents);
    }
    return data;
  }
  //clear sort arrows on columns
  clearColumnHeaders() {
    this.table.columnManager.getRealColumns().forEach((column) => {
      if (column.modules.sort) {
        column.modules.sort.dir = "none";
        column.getElement().setAttribute("aria-sort", "none");
        this.setColumnHeaderSortIcon(column, "none");
      }
    });
  }
  //set the column header sort direction
  setColumnHeader(column, dir) {
    column.modules.sort.dir = dir;
    column.getElement().setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
    this.setColumnHeaderSortIcon(column, dir);
  }
  setColumnHeaderSortIcon(column, dir) {
    var sortEl = column.modules.sort.element, arrowEl;
    if (column.definition.headerSort && typeof this.table.options.headerSortElement === "function") {
      while (sortEl.firstChild) sortEl.removeChild(sortEl.firstChild);
      arrowEl = this.table.options.headerSortElement.call(this.table, column.getComponent(), dir);
      if (typeof arrowEl === "object") {
        sortEl.appendChild(arrowEl);
      } else {
        sortEl.innerHTML = arrowEl;
      }
    }
  }
  //sort each item in sort list
  _sortItems(data, sortList) {
    var sorterCount = sortList.length - 1;
    data.sort((a, b) => {
      var result;
      for (var i = sorterCount; i >= 0; i--) {
        let sortItem = sortList[i];
        result = this._sortRow(a, b, sortItem.column, sortItem.dir, sortItem.params);
        if (result !== 0) {
          break;
        }
      }
      return result;
    });
  }
  //process individual rows for a sort function on active data
  _sortRow(a, b, column, dir, params) {
    var el1Comp, el2Comp;
    var el1 = dir == "asc" ? a : b;
    var el2 = dir == "asc" ? b : a;
    a = column.getFieldValue(el1.getData());
    b = column.getFieldValue(el2.getData());
    a = typeof a !== "undefined" ? a : "";
    b = typeof b !== "undefined" ? b : "";
    el1Comp = el1.getComponent();
    el2Comp = el2.getComponent();
    return column.modules.sort.sorter.call(this, a, b, el1Comp, el2Comp, column.getComponent(), dir, params);
  }
}
class Tooltip extends Module {
  static moduleName = "tooltip";
  constructor(table) {
    super(table);
    this.tooltipSubscriber = null, this.headerSubscriber = null, this.timeout = null;
    this.popupInstance = null;
    this.registerTableOption("tooltipDelay", 300);
    this.registerColumnOption("tooltip");
    this.registerColumnOption("headerTooltip");
  }
  initialize() {
    this.deprecatedOptionsCheck();
    this.subscribe("column-init", this.initializeColumn.bind(this));
  }
  deprecatedOptionsCheck() {
  }
  initializeColumn(column) {
    if (column.definition.headerTooltip && !this.headerSubscriber) {
      this.headerSubscriber = true;
      this.subscribe("column-mousemove", this.mousemoveCheck.bind(this, "headerTooltip"));
      this.subscribe("column-mouseout", this.mouseoutCheck.bind(this, "headerTooltip"));
    }
    if (column.definition.tooltip && !this.tooltipSubscriber) {
      this.tooltipSubscriber = true;
      this.subscribe("cell-mousemove", this.mousemoveCheck.bind(this, "tooltip"));
      this.subscribe("cell-mouseout", this.mouseoutCheck.bind(this, "tooltip"));
    }
  }
  mousemoveCheck(action, e, component) {
    var tooltip = action === "tooltip" ? component.column.definition.tooltip : component.definition.headerTooltip;
    if (tooltip) {
      this.clearPopup();
      this.timeout = setTimeout(this.loadTooltip.bind(this, e, component, tooltip), this.table.options.tooltipDelay);
    }
  }
  mouseoutCheck(action, e, component) {
    if (!this.popupInstance) {
      this.clearPopup();
    }
  }
  clearPopup(action, e, component) {
    clearTimeout(this.timeout);
    this.timeout = null;
    if (this.popupInstance) {
      this.popupInstance.hide();
    }
  }
  loadTooltip(e, component, tooltip) {
    var contentsEl, renderedCallback, coords;
    function onRendered(callback) {
      renderedCallback = callback;
    }
    if (typeof tooltip === "function") {
      tooltip = tooltip(e, component.getComponent(), onRendered);
    }
    if (tooltip instanceof HTMLElement) {
      contentsEl = tooltip;
    } else {
      contentsEl = document.createElement("div");
      if (tooltip === true) {
        if (component instanceof Cell) {
          tooltip = component.value;
        } else {
          if (component.definition.field) {
            this.langBind("columns|" + component.definition.field, (value) => {
              contentsEl.innerHTML = tooltip = value || component.definition.title;
            });
          } else {
            tooltip = component.definition.title;
          }
        }
      }
      contentsEl.innerHTML = tooltip;
    }
    if (tooltip || tooltip === 0 || tooltip === false) {
      contentsEl.classList.add("tabulator-tooltip");
      contentsEl.addEventListener("mousemove", (e2) => e2.preventDefault());
      this.popupInstance = this.popup(contentsEl);
      if (typeof renderedCallback === "function") {
        this.popupInstance.renderCallback(renderedCallback);
      }
      coords = this.popupInstance.containerEventCoords(e);
      this.popupInstance.show(coords.x + 15, coords.y + 15).hideOnBlur(() => {
        this.dispatchExternal("TooltipClosed", component.getComponent());
        this.popupInstance = null;
      });
      this.dispatchExternal("TooltipOpened", component.getComponent());
    }
  }
}
var defaultOptions = {
  debugEventsExternal: false,
  //flag to console log events
  debugEventsInternal: false,
  //flag to console log events
  debugInvalidOptions: true,
  //allow toggling of invalid option warnings
  debugInvalidComponentFuncs: true,
  //allow toggling of invalid component warnings
  debugInitialization: true,
  //allow toggling of pre initialization function call warnings
  debugDeprecation: true,
  //allow toggling of deprecation warnings
  height: false,
  //height of tabulator
  minHeight: false,
  //minimum height of tabulator
  maxHeight: false,
  //maximum height of tabulator
  columnHeaderVertAlign: "top",
  //vertical alignment of column headers
  popupContainer: false,
  columns: [],
  //store for colum header info
  columnDefaults: {},
  //store column default props
  rowHeader: false,
  data: false,
  //default starting data
  autoColumns: false,
  //build columns from data row structure
  autoColumnsDefinitions: false,
  nestedFieldSeparator: ".",
  //separator for nested data
  footerElement: false,
  //hold footer element
  index: "id",
  //filed for row index
  textDirection: "auto",
  addRowPos: "bottom",
  //position to insert blank rows, top|bottom
  headerVisible: true,
  //hide header
  renderVertical: "virtual",
  renderHorizontal: "basic",
  renderVerticalBuffer: 0,
  // set virtual DOM buffer size
  scrollToRowPosition: "top",
  scrollToRowIfVisible: true,
  scrollToColumnPosition: "left",
  scrollToColumnIfVisible: true,
  rowFormatter: false,
  rowFormatterPrint: null,
  rowFormatterClipboard: null,
  rowFormatterHtmlOutput: null,
  rowHeight: null,
  placeholder: false,
  dataLoader: true,
  dataLoaderLoading: false,
  dataLoaderError: false,
  dataLoaderErrorTimeout: 3e3,
  dataSendParams: {},
  dataReceiveParams: {},
  dependencies: {}
};
class OptionsList {
  constructor(table, msgType, defaults = {}) {
    this.table = table;
    this.msgType = msgType;
    this.registeredDefaults = Object.assign({}, defaults);
  }
  register(option, value) {
    this.registeredDefaults[option] = value;
  }
  generate(defaultOptions2, userOptions = {}) {
    var output = Object.assign({}, this.registeredDefaults), warn = this.table.options.debugInvalidOptions || userOptions.debugInvalidOptions === true;
    Object.assign(output, defaultOptions2);
    for (let key in userOptions) {
      if (!output.hasOwnProperty(key)) {
        if (warn) {
          console.warn("Invalid " + this.msgType + " option:", key);
        }
        output[key] = userOptions.key;
      }
    }
    for (let key in output) {
      if (key in userOptions) {
        output[key] = userOptions[key];
      } else {
        if (Array.isArray(output[key])) {
          output[key] = Object.assign([], output[key]);
        } else if (typeof output[key] === "object" && output[key] !== null) {
          output[key] = Object.assign({}, output[key]);
        } else if (typeof output[key] === "undefined") {
          delete output[key];
        }
      }
    }
    return output;
  }
}
class Renderer extends CoreFeature {
  constructor(table) {
    super(table);
    this.elementVertical = table.rowManager.element;
    this.elementHorizontal = table.columnManager.element;
    this.tableElement = table.rowManager.tableElement;
    this.verticalFillMode = "fit";
  }
  ///////////////////////////////////
  /////// Internal Bindings /////////
  ///////////////////////////////////
  initialize() {
  }
  clearRows() {
  }
  clearColumns() {
  }
  reinitializeColumnWidths(columns) {
  }
  renderRows() {
  }
  renderColumns() {
  }
  rerenderRows(callback) {
    if (callback) {
      callback();
    }
  }
  rerenderColumns(update, blockRedraw) {
  }
  renderRowCells(row) {
  }
  rerenderRowCells(row, force) {
  }
  scrollColumns(left, dir) {
  }
  scrollRows(top, dir) {
  }
  resize() {
  }
  scrollToRow(row) {
  }
  scrollToRowNearestTop(row) {
  }
  visibleRows(includingBuffer) {
    return [];
  }
  ///////////////////////////////////
  //////// Helper Functions /////////
  ///////////////////////////////////
  rows() {
    return this.table.rowManager.getDisplayRows();
  }
  styleRow(row, index) {
    var rowEl = row.getElement();
    if (index % 2) {
      rowEl.classList.add("tabulator-row-even");
      rowEl.classList.remove("tabulator-row-odd");
    } else {
      rowEl.classList.add("tabulator-row-odd");
      rowEl.classList.remove("tabulator-row-even");
    }
  }
  ///////////////////////////////////
  /////// External Triggers /////////
  /////// (DO NOT OVERRIDE) /////////
  ///////////////////////////////////
  clear() {
    this.clearRows();
    this.clearColumns();
  }
  render() {
    this.renderRows();
    this.renderColumns();
  }
  rerender(callback) {
    this.rerenderRows();
    this.rerenderColumns();
  }
  scrollToRowPosition(row, position, ifVisible) {
    var rowIndex = this.rows().indexOf(row), rowEl = row.getElement(), offset2 = 0;
    return new Promise((resolve, reject) => {
      if (rowIndex > -1) {
        if (typeof ifVisible === "undefined") {
          ifVisible = this.table.options.scrollToRowIfVisible;
        }
        if (!ifVisible) {
          if (Helpers.elVisible(rowEl)) {
            offset2 = Helpers.elOffset(rowEl).top - Helpers.elOffset(this.elementVertical).top;
            if (offset2 > 0 && offset2 < this.elementVertical.clientHeight - rowEl.offsetHeight) {
              resolve();
              return false;
            }
          }
        }
        if (typeof position === "undefined") {
          position = this.table.options.scrollToRowPosition;
        }
        if (position === "nearest") {
          position = this.scrollToRowNearestTop(row) ? "top" : "bottom";
        }
        this.scrollToRow(row);
        switch (position) {
          case "middle":
          case "center":
            if (this.elementVertical.scrollHeight - this.elementVertical.scrollTop == this.elementVertical.clientHeight) {
              this.elementVertical.scrollTop = this.elementVertical.scrollTop + (rowEl.offsetTop - this.elementVertical.scrollTop) - (this.elementVertical.scrollHeight - rowEl.offsetTop) / 2;
            } else {
              this.elementVertical.scrollTop = this.elementVertical.scrollTop - this.elementVertical.clientHeight / 2;
            }
            break;
          case "bottom":
            if (this.elementVertical.scrollHeight - this.elementVertical.scrollTop == this.elementVertical.clientHeight) {
              this.elementVertical.scrollTop = this.elementVertical.scrollTop - (this.elementVertical.scrollHeight - rowEl.offsetTop) + rowEl.offsetHeight;
            } else {
              this.elementVertical.scrollTop = this.elementVertical.scrollTop - this.elementVertical.clientHeight + rowEl.offsetHeight;
            }
            break;
          case "top":
            this.elementVertical.scrollTop = rowEl.offsetTop;
            break;
        }
        resolve();
      } else {
        console.warn("Scroll Error - Row not visible");
        reject("Scroll Error - Row not visible");
      }
    });
  }
}
class BasicHorizontal extends Renderer {
  constructor(table) {
    super(table);
  }
  renderRowCells(row, inFragment) {
    const rowFrag = document.createDocumentFragment();
    row.cells.forEach((cell) => {
      rowFrag.appendChild(cell.getElement());
    });
    row.element.appendChild(rowFrag);
    if (!inFragment) {
      row.cells.forEach((cell) => {
        cell.cellRendered();
      });
    }
  }
  reinitializeColumnWidths(columns) {
    columns.forEach(function(column) {
      column.reinitializeWidth();
    });
  }
}
class VirtualDomHorizontal extends Renderer {
  constructor(table) {
    super(table);
    this.leftCol = 0;
    this.rightCol = 0;
    this.scrollLeft = 0;
    this.vDomScrollPosLeft = 0;
    this.vDomScrollPosRight = 0;
    this.vDomPadLeft = 0;
    this.vDomPadRight = 0;
    this.fitDataColAvg = 0;
    this.windowBuffer = 200;
    this.visibleRows = null;
    this.initialized = false;
    this.isFitData = false;
    this.columns = [];
  }
  initialize() {
    this.compatibilityCheck();
    this.layoutCheck();
    this.vertScrollListen();
  }
  compatibilityCheck() {
    if (this.options("layout") == "fitDataTable") {
      console.warn("Horizontal Virtual DOM is not compatible with fitDataTable layout mode");
    }
    if (this.options("responsiveLayout")) {
      console.warn("Horizontal Virtual DOM is not compatible with responsive columns");
    }
    if (this.options("rtl")) {
      console.warn("Horizontal Virtual DOM is not currently compatible with RTL text direction");
    }
  }
  layoutCheck() {
    this.isFitData = this.options("layout").startsWith("fitData");
  }
  vertScrollListen() {
    this.subscribe("scroll-vertical", this.clearVisRowCache.bind(this));
    this.subscribe("data-refreshed", this.clearVisRowCache.bind(this));
  }
  clearVisRowCache() {
    this.visibleRows = null;
  }
  //////////////////////////////////////
  ///////// Public Functions ///////////
  //////////////////////////////////////
  renderColumns(row, force) {
    this.dataChange();
  }
  scrollColumns(left, dir) {
    if (this.scrollLeft != left) {
      this.scrollLeft = left;
      this.scroll(left - (this.vDomScrollPosLeft + this.windowBuffer));
    }
  }
  calcWindowBuffer() {
    var buffer = this.elementVertical.clientWidth;
    this.table.columnManager.columnsByIndex.forEach((column) => {
      if (column.visible) {
        var width = column.getWidth();
        if (width > buffer) {
          buffer = width;
        }
      }
    });
    this.windowBuffer = buffer * 2;
  }
  rerenderColumns(update, blockRedraw) {
    var old = {
      cols: this.columns,
      leftCol: this.leftCol,
      rightCol: this.rightCol
    }, colPos = 0;
    if (update && !this.initialized) {
      return;
    }
    this.clear();
    this.calcWindowBuffer();
    this.scrollLeft = this.elementVertical.scrollLeft;
    this.vDomScrollPosLeft = this.scrollLeft - this.windowBuffer;
    this.vDomScrollPosRight = this.scrollLeft + this.elementVertical.clientWidth + this.windowBuffer;
    this.table.columnManager.columnsByIndex.forEach((column) => {
      var config = {}, width;
      if (column.visible) {
        if (!column.modules.frozen) {
          width = column.getWidth();
          config.leftPos = colPos;
          config.rightPos = colPos + width;
          config.width = width;
          if (this.isFitData) {
            config.fitDataCheck = column.modules.vdomHoz ? column.modules.vdomHoz.fitDataCheck : true;
          }
          if (colPos + width > this.vDomScrollPosLeft && colPos < this.vDomScrollPosRight) {
            if (this.leftCol == -1) {
              this.leftCol = this.columns.length;
              this.vDomPadLeft = colPos;
            }
            this.rightCol = this.columns.length;
          } else {
            if (this.leftCol !== -1) {
              this.vDomPadRight += width;
            }
          }
          this.columns.push(column);
          column.modules.vdomHoz = config;
          colPos += width;
        }
      }
    });
    this.tableElement.style.paddingLeft = this.vDomPadLeft + "px";
    this.tableElement.style.paddingRight = this.vDomPadRight + "px";
    this.initialized = true;
    if (!blockRedraw) {
      if (!update || this.reinitChanged(old)) {
        this.reinitializeRows();
      }
    }
    this.elementVertical.scrollLeft = this.scrollLeft;
  }
  renderRowCells(row) {
    if (this.initialized) {
      this.initializeRow(row);
    } else {
      const rowFrag = document.createDocumentFragment();
      row.cells.forEach((cell) => {
        rowFrag.appendChild(cell.getElement());
      });
      row.element.appendChild(rowFrag);
      row.cells.forEach((cell) => {
        cell.cellRendered();
      });
    }
  }
  rerenderRowCells(row, force) {
    this.reinitializeRow(row, force);
  }
  reinitializeColumnWidths(columns) {
    for (let i = this.leftCol; i <= this.rightCol; i++) {
      let col = this.columns[i];
      if (col) {
        col.reinitializeWidth();
      }
    }
  }
  //////////////////////////////////////
  //////// Internal Rendering //////////
  //////////////////////////////////////
  deinitialize() {
    this.initialized = false;
  }
  clear() {
    this.columns = [];
    this.leftCol = -1;
    this.rightCol = 0;
    this.vDomScrollPosLeft = 0;
    this.vDomScrollPosRight = 0;
    this.vDomPadLeft = 0;
    this.vDomPadRight = 0;
  }
  dataChange() {
    var change = false, row, rowEl;
    if (this.isFitData) {
      this.table.columnManager.columnsByIndex.forEach((column) => {
        if (!column.definition.width && column.visible) {
          change = true;
        }
      });
      if (change && this.table.rowManager.getDisplayRows().length) {
        this.vDomScrollPosRight = this.scrollLeft + this.elementVertical.clientWidth + this.windowBuffer;
        row = this.chain("rows-sample", [1], [], () => {
          return this.table.rowManager.getDisplayRows();
        })[0];
        if (row) {
          rowEl = row.getElement();
          row.generateCells();
          this.tableElement.appendChild(rowEl);
          for (let colEnd = 0; colEnd < row.cells.length; colEnd++) {
            let cell = row.cells[colEnd];
            rowEl.appendChild(cell.getElement());
            cell.column.reinitializeWidth();
          }
          rowEl.parentNode.removeChild(rowEl);
          this.rerenderColumns(false, true);
        }
      }
    } else {
      if (this.options("layout") === "fitColumns") {
        this.layoutRefresh();
        this.rerenderColumns(false, true);
      }
    }
  }
  reinitChanged(old) {
    var match2 = true;
    if (old.cols.length !== this.columns.length || old.leftCol !== this.leftCol || old.rightCol !== this.rightCol) {
      return true;
    }
    old.cols.forEach((col, i) => {
      if (col !== this.columns[i]) {
        match2 = false;
      }
    });
    return !match2;
  }
  reinitializeRows() {
    var visibleRows = this.getVisibleRows(), otherRows = this.table.rowManager.getRows().filter((row) => !visibleRows.includes(row));
    visibleRows.forEach((row) => {
      this.reinitializeRow(row, true);
    });
    otherRows.forEach((row) => {
      row.deinitialize();
    });
  }
  getVisibleRows() {
    if (!this.visibleRows) {
      this.visibleRows = this.table.rowManager.getVisibleRows();
    }
    return this.visibleRows;
  }
  scroll(diff2) {
    this.vDomScrollPosLeft += diff2;
    this.vDomScrollPosRight += diff2;
    if (Math.abs(diff2) > this.windowBuffer / 2) {
      this.rerenderColumns();
    } else {
      if (diff2 > 0) {
        this.addColRight();
        this.removeColLeft();
      } else {
        this.addColLeft();
        this.removeColRight();
      }
    }
  }
  colPositionAdjust(start, end, diff2) {
    for (let i = start; i < end; i++) {
      let column = this.columns[i];
      column.modules.vdomHoz.leftPos += diff2;
      column.modules.vdomHoz.rightPos += diff2;
    }
  }
  addColRight() {
    var changes = false, working = true;
    while (working) {
      let column = this.columns[this.rightCol + 1];
      if (column) {
        if (column.modules.vdomHoz.leftPos <= this.vDomScrollPosRight) {
          changes = true;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              var cell = row.getCell(column);
              row.getElement().insertBefore(cell.getElement(), row.getCell(this.columns[this.rightCol]).getElement().nextSibling);
              cell.cellRendered();
            }
          });
          this.fitDataColActualWidthCheck(column);
          this.rightCol++;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              row.modules.vdomHoz.rightCol = this.rightCol;
            }
          });
          if (this.rightCol >= this.columns.length - 1) {
            this.vDomPadRight = 0;
          } else {
            this.vDomPadRight -= column.getWidth();
          }
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    if (changes) {
      this.tableElement.style.paddingRight = this.vDomPadRight + "px";
    }
  }
  addColLeft() {
    var changes = false, working = true;
    while (working) {
      let column = this.columns[this.leftCol - 1];
      if (column) {
        if (column.modules.vdomHoz.rightPos >= this.vDomScrollPosLeft) {
          changes = true;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              var cell = row.getCell(column);
              row.getElement().insertBefore(cell.getElement(), row.getCell(this.columns[this.leftCol]).getElement());
              cell.cellRendered();
            }
          });
          this.leftCol--;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              row.modules.vdomHoz.leftCol = this.leftCol;
            }
          });
          if (this.leftCol <= 0) {
            this.vDomPadLeft = 0;
          } else {
            this.vDomPadLeft -= column.getWidth();
          }
          let diff2 = this.fitDataColActualWidthCheck(column);
          if (diff2) {
            this.scrollLeft = this.elementVertical.scrollLeft = this.elementVertical.scrollLeft + diff2;
            this.vDomPadRight -= diff2;
          }
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    if (changes) {
      this.tableElement.style.paddingLeft = this.vDomPadLeft + "px";
    }
  }
  removeColRight() {
    var changes = false, working = true;
    while (working) {
      let column = this.columns[this.rightCol];
      if (column) {
        if (column.modules.vdomHoz.leftPos > this.vDomScrollPosRight) {
          changes = true;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              var cell = row.getCell(column);
              try {
                row.getElement().removeChild(cell.getElement());
              } catch (ex) {
                console.warn("Could not removeColRight", ex.message);
              }
            }
          });
          this.vDomPadRight += column.getWidth();
          this.rightCol--;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              row.modules.vdomHoz.rightCol = this.rightCol;
            }
          });
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    if (changes) {
      this.tableElement.style.paddingRight = this.vDomPadRight + "px";
    }
  }
  removeColLeft() {
    var changes = false, working = true;
    while (working) {
      let column = this.columns[this.leftCol];
      if (column) {
        if (column.modules.vdomHoz.rightPos < this.vDomScrollPosLeft) {
          changes = true;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              var cell = row.getCell(column);
              try {
                row.getElement().removeChild(cell.getElement());
              } catch (ex) {
                console.warn("Could not removeColLeft", ex.message);
              }
            }
          });
          this.vDomPadLeft += column.getWidth();
          this.leftCol++;
          this.getVisibleRows().forEach((row) => {
            if (row.type !== "group") {
              row.modules.vdomHoz.leftCol = this.leftCol;
            }
          });
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    if (changes) {
      this.tableElement.style.paddingLeft = this.vDomPadLeft + "px";
    }
  }
  fitDataColActualWidthCheck(column) {
    var newWidth, widthDiff;
    if (column.modules.vdomHoz.fitDataCheck) {
      column.reinitializeWidth();
      newWidth = column.getWidth();
      widthDiff = newWidth - column.modules.vdomHoz.width;
      if (widthDiff) {
        column.modules.vdomHoz.rightPos += widthDiff;
        column.modules.vdomHoz.width = newWidth;
        this.colPositionAdjust(this.columns.indexOf(column) + 1, this.columns.length, widthDiff);
      }
      column.modules.vdomHoz.fitDataCheck = false;
    }
    return widthDiff;
  }
  initializeRow(row) {
    if (row.type !== "group") {
      row.modules.vdomHoz = {
        leftCol: this.leftCol,
        rightCol: this.rightCol
      };
      if (this.table.modules.frozenColumns) {
        this.table.modules.frozenColumns.leftColumns.forEach((column) => {
          this.appendCell(row, column);
        });
      }
      for (let i = this.leftCol; i <= this.rightCol; i++) {
        this.appendCell(row, this.columns[i]);
      }
      if (this.table.modules.frozenColumns) {
        this.table.modules.frozenColumns.rightColumns.forEach((column) => {
          this.appendCell(row, column);
        });
      }
    }
  }
  appendCell(row, column) {
    if (column && column.visible) {
      let cell = row.getCell(column);
      row.getElement().appendChild(cell.getElement());
      cell.cellRendered();
    }
  }
  reinitializeRow(row, force) {
    if (row.type !== "group") {
      if (force || !row.modules.vdomHoz || row.modules.vdomHoz.leftCol !== this.leftCol || row.modules.vdomHoz.rightCol !== this.rightCol) {
        var rowEl = row.getElement();
        while (rowEl.firstChild) rowEl.removeChild(rowEl.firstChild);
        this.initializeRow(row);
      }
    }
  }
}
class ColumnManager extends CoreFeature {
  constructor(table) {
    super(table);
    this.blockHozScrollEvent = false;
    this.headersElement = null;
    this.contentsElement = null;
    this.rowHeader = null;
    this.element = null;
    this.columns = [];
    this.columnsByIndex = [];
    this.columnsByField = {};
    this.scrollLeft = 0;
    this.optionsList = new OptionsList(this.table, "column definition", defaultColumnOptions);
    this.redrawBlock = false;
    this.redrawBlockUpdate = null;
    this.renderer = null;
  }
  ////////////// Setup Functions /////////////////
  initialize() {
    this.initializeRenderer();
    this.headersElement = this.createHeadersElement();
    this.contentsElement = this.createHeaderContentsElement();
    this.element = this.createHeaderElement();
    this.contentsElement.insertBefore(this.headersElement, this.contentsElement.firstChild);
    this.element.insertBefore(this.contentsElement, this.element.firstChild);
    this.initializeScrollWheelWatcher();
    this.subscribe("scroll-horizontal", this.scrollHorizontal.bind(this));
    this.subscribe("scrollbar-vertical", this.padVerticalScrollbar.bind(this));
  }
  padVerticalScrollbar(width) {
    if (this.table.rtl) {
      this.headersElement.style.marginLeft = width + "px";
    } else {
      this.headersElement.style.marginRight = width + "px";
    }
  }
  initializeRenderer() {
    var renderClass;
    var renderers = {
      "virtual": VirtualDomHorizontal,
      "basic": BasicHorizontal
    };
    if (typeof this.table.options.renderHorizontal === "string") {
      renderClass = renderers[this.table.options.renderHorizontal];
    } else {
      renderClass = this.table.options.renderHorizontal;
    }
    if (renderClass) {
      this.renderer = new renderClass(this.table, this.element, this.tableElement);
      this.renderer.initialize();
    } else {
      console.error("Unable to find matching renderer:", this.table.options.renderHorizontal);
    }
  }
  createHeadersElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-headers");
    el.setAttribute("role", "row");
    return el;
  }
  createHeaderContentsElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-header-contents");
    el.setAttribute("role", "rowgroup");
    return el;
  }
  createHeaderElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-header");
    el.setAttribute("role", "rowgroup");
    if (!this.table.options.headerVisible) {
      el.classList.add("tabulator-header-hidden");
    }
    return el;
  }
  //return containing element
  getElement() {
    return this.element;
  }
  //return containing contents element
  getContentsElement() {
    return this.contentsElement;
  }
  //return header containing element
  getHeadersElement() {
    return this.headersElement;
  }
  //scroll horizontally to match table body
  scrollHorizontal(left) {
    this.contentsElement.scrollLeft = left;
    this.scrollLeft = left;
    this.renderer.scrollColumns(left);
  }
  initializeScrollWheelWatcher() {
    this.contentsElement.addEventListener("wheel", (e) => {
      var left;
      if (e.deltaX) {
        left = this.contentsElement.scrollLeft + e.deltaX;
        this.table.rowManager.scrollHorizontal(left);
        this.table.columnManager.scrollHorizontal(left);
      }
    });
  }
  ///////////// Column Setup Functions /////////////
  generateColumnsFromRowData(data) {
    var cols = [], collProgress = {}, rowSample = this.table.options.autoColumns === "full" ? data : [data[0]], definitions = this.table.options.autoColumnsDefinitions;
    if (data && data.length) {
      rowSample.forEach((row) => {
        Object.keys(row).forEach((key, index) => {
          let value = row[key], col;
          if (!collProgress[key]) {
            col = {
              field: key,
              title: key,
              sorter: this.calculateSorterFromValue(value)
            };
            cols.splice(index, 0, col);
            collProgress[key] = typeof value === "undefined" ? col : true;
          } else if (collProgress[key] !== true) {
            if (typeof value !== "undefined") {
              collProgress[key].sorter = this.calculateSorterFromValue(value);
              collProgress[key] = true;
            }
          }
        });
      });
      if (definitions) {
        switch (typeof definitions) {
          case "function":
            this.table.options.columns = definitions.call(this.table, cols);
            break;
          case "object":
            if (Array.isArray(definitions)) {
              cols.forEach((col) => {
                var match2 = definitions.find((def) => {
                  return def.field === col.field;
                });
                if (match2) {
                  Object.assign(col, match2);
                }
              });
            } else {
              cols.forEach((col) => {
                if (definitions[col.field]) {
                  Object.assign(col, definitions[col.field]);
                }
              });
            }
            this.table.options.columns = cols;
            break;
        }
      } else {
        this.table.options.columns = cols;
      }
      this.setColumns(this.table.options.columns);
    }
  }
  calculateSorterFromValue(value) {
    var sorter;
    switch (typeof value) {
      case "undefined":
        sorter = "string";
        break;
      case "boolean":
        sorter = "boolean";
        break;
      case "number":
        sorter = "number";
        break;
      case "object":
        if (Array.isArray(value)) {
          sorter = "array";
        } else {
          sorter = "string";
        }
        break;
      default:
        if (!isNaN(value) && value !== "") {
          sorter = "number";
        } else {
          if (value.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+$/i)) {
            sorter = "alphanum";
          } else {
            sorter = "string";
          }
        }
        break;
    }
    return sorter;
  }
  setColumns(cols, row) {
    while (this.headersElement.firstChild) this.headersElement.removeChild(this.headersElement.firstChild);
    this.columns = [];
    this.columnsByIndex = [];
    this.columnsByField = {};
    this.dispatch("columns-loading");
    this.dispatchExternal("columnsLoading");
    if (this.table.options.rowHeader) {
      this.rowHeader = new Column(this.table.options.rowHeader === true ? {} : this.table.options.rowHeader, this, true);
      this.columns.push(this.rowHeader);
      this.headersElement.appendChild(this.rowHeader.getElement());
      this.rowHeader.columnRendered();
    }
    cols.forEach((def, i) => {
      this._addColumn(def);
    });
    this._reIndexColumns();
    this.dispatch("columns-loaded");
    if (this.subscribedExternal("columnsLoaded")) {
      this.dispatchExternal("columnsLoaded", this.getComponents());
    }
    this.rerenderColumns(false, true);
    this.redraw(true);
  }
  _addColumn(definition, before, nextToColumn) {
    var column = new Column(definition, this), colEl = column.getElement(), index = nextToColumn ? this.findColumnIndex(nextToColumn) : nextToColumn;
    if (before && this.rowHeader && (!nextToColumn || nextToColumn === this.rowHeader)) {
      before = false;
      nextToColumn = this.rowHeader;
      index = 0;
    }
    if (nextToColumn && index > -1) {
      var topColumn = nextToColumn.getTopColumn();
      var parentIndex = this.columns.indexOf(topColumn);
      var nextEl = topColumn.getElement();
      if (before) {
        this.columns.splice(parentIndex, 0, column);
        nextEl.parentNode.insertBefore(colEl, nextEl);
      } else {
        this.columns.splice(parentIndex + 1, 0, column);
        nextEl.parentNode.insertBefore(colEl, nextEl.nextSibling);
      }
    } else {
      if (before) {
        this.columns.unshift(column);
        this.headersElement.insertBefore(column.getElement(), this.headersElement.firstChild);
      } else {
        this.columns.push(column);
        this.headersElement.appendChild(column.getElement());
      }
    }
    column.columnRendered();
    return column;
  }
  registerColumnField(col) {
    if (col.definition.field) {
      this.columnsByField[col.definition.field] = col;
    }
  }
  registerColumnPosition(col) {
    this.columnsByIndex.push(col);
  }
  _reIndexColumns() {
    this.columnsByIndex = [];
    this.columns.forEach(function(column) {
      column.reRegisterPosition();
    });
  }
  //ensure column headers take up the correct amount of space in column groups
  verticalAlignHeaders() {
    var minHeight = 0;
    if (!this.redrawBlock) {
      this.headersElement.style.height = "";
      this.columns.forEach((column) => {
        column.clearVerticalAlign();
      });
      this.columns.forEach((column) => {
        var height = column.getHeight();
        if (height > minHeight) {
          minHeight = height;
        }
      });
      this.headersElement.style.height = minHeight + "px";
      this.columns.forEach((column) => {
        column.verticalAlign(this.table.options.columnHeaderVertAlign, minHeight);
      });
      this.table.rowManager.adjustTableSize();
    }
  }
  //////////////// Column Details /////////////////
  findColumn(subject) {
    var columns;
    if (typeof subject == "object") {
      if (subject instanceof Column) {
        return subject;
      } else if (subject instanceof ColumnComponent) {
        return subject._getSelf() || false;
      } else if (typeof HTMLElement !== "undefined" && subject instanceof HTMLElement) {
        columns = [];
        this.columns.forEach((column) => {
          columns.push(column);
          columns = columns.concat(column.getColumns(true));
        });
        let match2 = columns.find((column) => {
          return column.element === subject;
        });
        return match2 || false;
      }
    } else {
      return this.columnsByField[subject] || false;
    }
    return false;
  }
  getColumnByField(field) {
    return this.columnsByField[field];
  }
  getColumnsByFieldRoot(root) {
    var matches = [];
    Object.keys(this.columnsByField).forEach((field) => {
      var fieldRoot = this.table.options.nestedFieldSeparator ? field.split(this.table.options.nestedFieldSeparator)[0] : field;
      if (fieldRoot === root) {
        matches.push(this.columnsByField[field]);
      }
    });
    return matches;
  }
  getColumnByIndex(index) {
    return this.columnsByIndex[index];
  }
  getFirstVisibleColumn() {
    var index = this.columnsByIndex.findIndex((col) => {
      return col.visible;
    });
    return index > -1 ? this.columnsByIndex[index] : false;
  }
  getVisibleColumnsByIndex() {
    return this.columnsByIndex.filter((col) => col.visible);
  }
  getColumns() {
    return this.columns;
  }
  findColumnIndex(column) {
    return this.columnsByIndex.findIndex((col) => {
      return column === col;
    });
  }
  //return all columns that are not groups
  getRealColumns() {
    return this.columnsByIndex;
  }
  //traverse across columns and call action
  traverse(callback) {
    this.columnsByIndex.forEach((column, i) => {
      callback(column, i);
    });
  }
  //get definitions of actual columns
  getDefinitions(active) {
    var output = [];
    this.columnsByIndex.forEach((column) => {
      if (!active || active && column.visible) {
        output.push(column.getDefinition());
      }
    });
    return output;
  }
  //get full nested definition tree
  getDefinitionTree() {
    var output = [];
    this.columns.forEach((column) => {
      output.push(column.getDefinition(true));
    });
    return output;
  }
  getComponents(structured) {
    var output = [], columns = structured ? this.columns : this.columnsByIndex;
    columns.forEach((column) => {
      output.push(column.getComponent());
    });
    return output;
  }
  getWidth() {
    var width = 0;
    this.columnsByIndex.forEach((column) => {
      if (column.visible) {
        width += column.getWidth();
      }
    });
    return width;
  }
  moveColumn(from, to, after) {
    to.element.parentNode.insertBefore(from.element, to.element);
    if (after) {
      to.element.parentNode.insertBefore(to.element, from.element);
    }
    this.moveColumnActual(from, to, after);
    this.verticalAlignHeaders();
    this.table.rowManager.reinitialize();
  }
  moveColumnActual(from, to, after) {
    if (from.parent.isGroup) {
      this._moveColumnInArray(from.parent.columns, from, to, after);
    } else {
      this._moveColumnInArray(this.columns, from, to, after);
    }
    this._moveColumnInArray(this.columnsByIndex, from, to, after, true);
    this.rerenderColumns(true);
    this.dispatch("column-moved", from, to, after);
    if (this.subscribedExternal("columnMoved")) {
      this.dispatchExternal("columnMoved", from.getComponent(), this.table.columnManager.getComponents());
    }
  }
  _moveColumnInArray(columns, from, to, after, updateRows) {
    var fromIndex = columns.indexOf(from), toIndex, rows2 = [];
    if (fromIndex > -1) {
      columns.splice(fromIndex, 1);
      toIndex = columns.indexOf(to);
      if (toIndex > -1) {
        if (after) {
          toIndex = toIndex + 1;
        }
      } else {
        toIndex = fromIndex;
      }
      columns.splice(toIndex, 0, from);
      if (updateRows) {
        rows2 = this.chain("column-moving-rows", [from, to, after], null, []) || [];
        rows2 = rows2.concat(this.table.rowManager.rows);
        rows2.forEach(function(row) {
          if (row.cells.length) {
            var cell = row.cells.splice(fromIndex, 1)[0];
            row.cells.splice(toIndex, 0, cell);
          }
        });
      }
    }
  }
  scrollToColumn(column, position, ifVisible) {
    var left = 0, offset2 = column.getLeftOffset(), adjust = 0, colEl = column.getElement();
    return new Promise((resolve, reject) => {
      if (typeof position === "undefined") {
        position = this.table.options.scrollToColumnPosition;
      }
      if (typeof ifVisible === "undefined") {
        ifVisible = this.table.options.scrollToColumnIfVisible;
      }
      if (column.visible) {
        switch (position) {
          case "middle":
          case "center":
            adjust = -this.element.clientWidth / 2;
            break;
          case "right":
            adjust = colEl.clientWidth - this.headersElement.clientWidth;
            break;
        }
        if (!ifVisible) {
          if (offset2 > 0 && offset2 + colEl.offsetWidth < this.element.clientWidth) {
            return false;
          }
        }
        left = offset2 + adjust;
        left = Math.max(Math.min(left, this.table.rowManager.element.scrollWidth - this.table.rowManager.element.clientWidth), 0);
        this.table.rowManager.scrollHorizontal(left);
        this.scrollHorizontal(left);
        resolve();
      } else {
        console.warn("Scroll Error - Column not visible");
        reject("Scroll Error - Column not visible");
      }
    });
  }
  //////////////// Cell Management /////////////////
  generateCells(row) {
    var cells = [];
    this.columnsByIndex.forEach((column) => {
      cells.push(column.generateCell(row));
    });
    return cells;
  }
  //////////////// Column Management /////////////////
  getFlexBaseWidth() {
    var totalWidth = this.table.element.clientWidth, fixedWidth = 0;
    if (this.table.rowManager.element.scrollHeight > this.table.rowManager.element.clientHeight) {
      totalWidth -= this.table.rowManager.element.offsetWidth - this.table.rowManager.element.clientWidth;
    }
    this.columnsByIndex.forEach(function(column) {
      var width, minWidth, colWidth;
      if (column.visible) {
        width = column.definition.width || 0;
        minWidth = parseInt(column.minWidth);
        if (typeof width == "string") {
          if (width.indexOf("%") > -1) {
            colWidth = totalWidth / 100 * parseInt(width);
          } else {
            colWidth = parseInt(width);
          }
        } else {
          colWidth = width;
        }
        fixedWidth += colWidth > minWidth ? colWidth : minWidth;
      }
    });
    return fixedWidth;
  }
  addColumn(definition, before, nextToColumn) {
    return new Promise((resolve, reject) => {
      var column = this._addColumn(definition, before, nextToColumn);
      this._reIndexColumns();
      this.dispatch("column-add", definition, before, nextToColumn);
      if (this.layoutMode() != "fitColumns") {
        column.reinitializeWidth();
      }
      this.redraw(true);
      this.table.rowManager.reinitialize();
      this.rerenderColumns();
      resolve(column);
    });
  }
  //remove column from system
  deregisterColumn(column) {
    var field = column.getField(), index;
    if (field) {
      delete this.columnsByField[field];
    }
    index = this.columnsByIndex.indexOf(column);
    if (index > -1) {
      this.columnsByIndex.splice(index, 1);
    }
    index = this.columns.indexOf(column);
    if (index > -1) {
      this.columns.splice(index, 1);
    }
    this.verticalAlignHeaders();
    this.redraw();
  }
  rerenderColumns(update, silent) {
    if (!this.redrawBlock) {
      this.renderer.rerenderColumns(update, silent);
    } else {
      if (update === false || update === true && this.redrawBlockUpdate === null) {
        this.redrawBlockUpdate = update;
      }
    }
  }
  blockRedraw() {
    this.redrawBlock = true;
    this.redrawBlockUpdate = null;
  }
  restoreRedraw() {
    this.redrawBlock = false;
    this.verticalAlignHeaders();
    this.renderer.rerenderColumns(this.redrawBlockUpdate);
  }
  //redraw columns
  redraw(force) {
    if (Helpers.elVisible(this.element)) {
      this.verticalAlignHeaders();
    }
    if (force) {
      this.table.rowManager.resetScroll();
      this.table.rowManager.reinitialize();
    }
    if (!this.confirm("table-redrawing", force)) {
      this.layoutRefresh(force);
    }
    this.dispatch("table-redraw", force);
    this.table.footerManager.redraw();
  }
}
class BasicVertical extends Renderer {
  constructor(table) {
    super(table);
    this.verticalFillMode = "fill";
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.scrollLeft = 0;
  }
  clearRows() {
    var element = this.tableElement;
    while (element.firstChild) element.removeChild(element.firstChild);
    element.scrollTop = 0;
    element.scrollLeft = 0;
    element.style.minWidth = "";
    element.style.minHeight = "";
    element.style.display = "";
    element.style.visibility = "";
  }
  renderRows() {
    var element = this.tableElement, onlyGroupHeaders = true, tableFrag = document.createDocumentFragment(), rows2 = this.rows();
    rows2.forEach((row, index) => {
      this.styleRow(row, index);
      row.initialize(false, true);
      if (row.type !== "group") {
        onlyGroupHeaders = false;
      }
      tableFrag.appendChild(row.getElement());
    });
    element.appendChild(tableFrag);
    rows2.forEach((row) => {
      row.rendered();
      if (!row.heightInitialized) {
        row.calcHeight(true);
      }
    });
    rows2.forEach((row) => {
      if (!row.heightInitialized) {
        row.setCellHeight();
      }
    });
    if (onlyGroupHeaders) {
      element.style.minWidth = this.table.columnManager.getWidth() + "px";
    } else {
      element.style.minWidth = "";
    }
  }
  rerenderRows(callback) {
    this.clearRows();
    if (callback) {
      callback();
    }
    this.renderRows();
    if (!this.rows().length) {
      this.table.rowManager.tableEmpty();
    }
  }
  scrollToRowNearestTop(row) {
    var rowTop = Helpers.elOffset(row.getElement()).top;
    return !(Math.abs(this.elementVertical.scrollTop - rowTop) > Math.abs(this.elementVertical.scrollTop + this.elementVertical.clientHeight - rowTop));
  }
  scrollToRow(row) {
    var rowEl = row.getElement();
    this.elementVertical.scrollTop = Helpers.elOffset(rowEl).top - Helpers.elOffset(this.elementVertical).top + this.elementVertical.scrollTop;
  }
  visibleRows(includingBuffer) {
    return this.rows();
  }
}
class VirtualDomVertical extends Renderer {
  constructor(table) {
    super(table);
    this.verticalFillMode = "fill";
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.vDomRowHeight = 20;
    this.vDomTop = 0;
    this.vDomBottom = 0;
    this.vDomScrollPosTop = 0;
    this.vDomScrollPosBottom = 0;
    this.vDomTopPad = 0;
    this.vDomBottomPad = 0;
    this.vDomMaxRenderChain = 90;
    this.vDomWindowBuffer = 0;
    this.vDomWindowMinTotalRows = 20;
    this.vDomWindowMinMarginRows = 5;
    this.vDomTopNewRows = [];
    this.vDomBottomNewRows = [];
  }
  //////////////////////////////////////
  ///////// Public Functions ///////////
  //////////////////////////////////////
  clearRows() {
    var element = this.tableElement;
    while (element.firstChild) element.removeChild(element.firstChild);
    element.style.paddingTop = "";
    element.style.paddingBottom = "";
    element.style.minHeight = "";
    element.style.display = "";
    element.style.visibility = "";
    this.elementVertical.scrollTop = 0;
    this.elementVertical.scrollLeft = 0;
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.vDomTop = 0;
    this.vDomBottom = 0;
    this.vDomTopPad = 0;
    this.vDomBottomPad = 0;
    this.vDomScrollPosTop = 0;
    this.vDomScrollPosBottom = 0;
  }
  renderRows() {
    this._virtualRenderFill();
  }
  rerenderRows(callback) {
    var scrollTop = this.elementVertical.scrollTop;
    var topRow = false;
    var topOffset = false;
    var left = this.table.rowManager.scrollLeft;
    var rows2 = this.rows();
    for (var i = this.vDomTop; i <= this.vDomBottom; i++) {
      if (rows2[i]) {
        var diff2 = scrollTop - rows2[i].getElement().offsetTop;
        if (topOffset === false || Math.abs(diff2) < topOffset) {
          topOffset = diff2;
          topRow = i;
        } else {
          break;
        }
      }
    }
    rows2.forEach((row) => {
      row.deinitializeHeight();
    });
    if (callback) {
      callback();
    }
    if (this.rows().length) {
      this._virtualRenderFill(topRow === false ? this.rows.length - 1 : topRow, true, topOffset || 0);
    } else {
      this.clear();
      this.table.rowManager.tableEmpty();
    }
    this.scrollColumns(left);
  }
  scrollColumns(left) {
    this.table.rowManager.scrollHorizontal(left);
  }
  scrollRows(top, dir) {
    var topDiff = top - this.vDomScrollPosTop;
    var bottomDiff = top - this.vDomScrollPosBottom;
    var margin = this.vDomWindowBuffer * 2;
    var rows2 = this.rows();
    this.scrollTop = top;
    if (-topDiff > margin || bottomDiff > margin) {
      var left = this.table.rowManager.scrollLeft;
      this._virtualRenderFill(Math.floor(this.elementVertical.scrollTop / this.elementVertical.scrollHeight * rows2.length));
      this.scrollColumns(left);
    } else {
      if (dir) {
        if (topDiff < 0) {
          this._addTopRow(rows2, -topDiff);
        }
        if (bottomDiff < 0) {
          if (this.vDomScrollHeight - this.scrollTop > this.vDomWindowBuffer) {
            this._removeBottomRow(rows2, -bottomDiff);
          } else {
            this.vDomScrollPosBottom = this.scrollTop;
          }
        }
      } else {
        if (bottomDiff >= 0) {
          this._addBottomRow(rows2, bottomDiff);
        }
        if (topDiff >= 0) {
          if (this.scrollTop > this.vDomWindowBuffer) {
            this._removeTopRow(rows2, topDiff);
          } else {
            this.vDomScrollPosTop = this.scrollTop;
          }
        }
      }
    }
  }
  resize() {
    this.vDomWindowBuffer = this.table.options.renderVerticalBuffer || this.elementVertical.clientHeight;
  }
  scrollToRowNearestTop(row) {
    var rowIndex = this.rows().indexOf(row);
    return !(Math.abs(this.vDomTop - rowIndex) > Math.abs(this.vDomBottom - rowIndex));
  }
  scrollToRow(row) {
    var index = this.rows().indexOf(row);
    if (index > -1) {
      this._virtualRenderFill(index, true);
    }
  }
  visibleRows(includingBuffer) {
    var topEdge = this.elementVertical.scrollTop, bottomEdge = this.elementVertical.clientHeight + topEdge, topFound = false, topRow = 0, bottomRow = 0, rows2 = this.rows();
    if (includingBuffer) {
      topRow = this.vDomTop;
      bottomRow = this.vDomBottom;
    } else {
      for (var i = this.vDomTop; i <= this.vDomBottom; i++) {
        if (rows2[i]) {
          if (!topFound) {
            if (topEdge - rows2[i].getElement().offsetTop >= 0) {
              topRow = i;
            } else {
              topFound = true;
              if (bottomEdge - rows2[i].getElement().offsetTop >= 0) {
                bottomRow = i;
              } else {
                break;
              }
            }
          } else {
            if (bottomEdge - rows2[i].getElement().offsetTop >= 0) {
              bottomRow = i;
            } else {
              break;
            }
          }
        }
      }
    }
    return rows2.slice(topRow, bottomRow + 1);
  }
  //////////////////////////////////////
  //////// Internal Rendering //////////
  //////////////////////////////////////
  //full virtual render
  _virtualRenderFill(position, forceMove, offset2) {
    var element = this.tableElement, holder = this.elementVertical, topPad = 0, rowsHeight = 0, rowHeight = 0, heightOccupied = 0, topPadHeight = 0, i = 0, rows2 = this.rows(), rowsCount = rows2.length, index = 0, row, rowFragment, renderedRows = [], totalRowsRendered = 0, rowsToRender = 0, fixedHeight = this.table.rowManager.fixedHeight, containerHeight = this.elementVertical.clientHeight, avgRowHeight = this.table.options.rowHeight, resized = true;
    position = position || 0;
    offset2 = offset2 || 0;
    if (!position) {
      this.clear();
    } else {
      while (element.firstChild) element.removeChild(element.firstChild);
      heightOccupied = (rowsCount - position + 1) * this.vDomRowHeight;
      if (heightOccupied < containerHeight) {
        position -= Math.ceil((containerHeight - heightOccupied) / this.vDomRowHeight);
        if (position < 0) {
          position = 0;
        }
      }
      topPad = Math.min(Math.max(Math.floor(this.vDomWindowBuffer / this.vDomRowHeight), this.vDomWindowMinMarginRows), position);
      position -= topPad;
    }
    if (rowsCount && Helpers.elVisible(this.elementVertical)) {
      this.vDomTop = position;
      this.vDomBottom = position - 1;
      if (fixedHeight || this.table.options.maxHeight) {
        if (avgRowHeight) {
          rowsToRender = containerHeight / avgRowHeight + this.vDomWindowBuffer / avgRowHeight;
        }
        rowsToRender = Math.max(this.vDomWindowMinTotalRows, Math.ceil(rowsToRender));
      } else {
        rowsToRender = rowsCount;
      }
      while ((rowsToRender == rowsCount || rowsHeight <= containerHeight + this.vDomWindowBuffer || totalRowsRendered < this.vDomWindowMinTotalRows) && this.vDomBottom < rowsCount - 1) {
        renderedRows = [];
        rowFragment = document.createDocumentFragment();
        i = 0;
        while (i < rowsToRender && this.vDomBottom < rowsCount - 1) {
          index = this.vDomBottom + 1, row = rows2[index];
          this.styleRow(row, index);
          row.initialize(false, true);
          if (!row.heightInitialized && !this.table.options.rowHeight) {
            row.clearCellHeight();
          }
          rowFragment.appendChild(row.getElement());
          renderedRows.push(row);
          this.vDomBottom++;
          i++;
        }
        if (!renderedRows.length) {
          break;
        }
        element.appendChild(rowFragment);
        renderedRows.forEach((row2) => {
          row2.rendered();
          if (!row2.heightInitialized) {
            row2.calcHeight(true);
          }
        });
        renderedRows.forEach((row2) => {
          if (!row2.heightInitialized) {
            row2.setCellHeight();
          }
        });
        renderedRows.forEach((row2) => {
          rowHeight = row2.getHeight();
          if (totalRowsRendered < topPad) {
            topPadHeight += rowHeight;
          } else {
            rowsHeight += rowHeight;
          }
          if (rowHeight > this.vDomWindowBuffer) {
            this.vDomWindowBuffer = rowHeight * 2;
          }
          totalRowsRendered++;
        });
        resized = this.table.rowManager.adjustTableSize();
        containerHeight = this.elementVertical.clientHeight;
        if (resized && (fixedHeight || this.table.options.maxHeight)) {
          avgRowHeight = rowsHeight / totalRowsRendered;
          rowsToRender = Math.max(this.vDomWindowMinTotalRows, Math.ceil(containerHeight / avgRowHeight + this.vDomWindowBuffer / avgRowHeight));
        }
      }
      if (!position) {
        this.vDomTopPad = 0;
        this.vDomRowHeight = Math.floor((rowsHeight + topPadHeight) / totalRowsRendered);
        this.vDomBottomPad = this.vDomRowHeight * (rowsCount - this.vDomBottom - 1);
        this.vDomScrollHeight = topPadHeight + rowsHeight + this.vDomBottomPad - containerHeight;
      } else {
        this.vDomTopPad = !forceMove ? this.scrollTop - topPadHeight : this.vDomRowHeight * this.vDomTop + offset2;
        this.vDomBottomPad = this.vDomBottom == rowsCount - 1 ? 0 : Math.max(this.vDomScrollHeight - this.vDomTopPad - rowsHeight - topPadHeight, 0);
      }
      element.style.paddingTop = this.vDomTopPad + "px";
      element.style.paddingBottom = this.vDomBottomPad + "px";
      if (forceMove) {
        this.scrollTop = this.vDomTopPad + topPadHeight + offset2 - (this.elementVertical.scrollWidth > this.elementVertical.clientWidth ? this.elementVertical.offsetHeight - containerHeight : 0);
      }
      this.scrollTop = Math.min(this.scrollTop, this.elementVertical.scrollHeight - containerHeight);
      if (this.elementVertical.scrollWidth > this.elementVertical.clientWidth && forceMove) {
        this.scrollTop += this.elementVertical.offsetHeight - containerHeight;
      }
      this.vDomScrollPosTop = this.scrollTop;
      this.vDomScrollPosBottom = this.scrollTop;
      holder.scrollTop = this.scrollTop;
      this.dispatch("render-virtual-fill");
    }
  }
  _addTopRow(rows2, fillableSpace) {
    var table = this.tableElement, addedRows = [], paddingAdjust = 0, index = this.vDomTop - 1, i = 0, working = true;
    while (working) {
      if (this.vDomTop) {
        let row = rows2[index], rowHeight, initialized;
        if (row && i < this.vDomMaxRenderChain) {
          rowHeight = row.getHeight() || this.vDomRowHeight;
          initialized = row.initialized;
          if (fillableSpace >= rowHeight) {
            this.styleRow(row, index);
            table.insertBefore(row.getElement(), table.firstChild);
            if (!row.initialized || !row.heightInitialized) {
              addedRows.push(row);
            }
            row.initialize();
            if (!initialized) {
              rowHeight = row.getElement().offsetHeight;
              if (rowHeight > this.vDomWindowBuffer) {
                this.vDomWindowBuffer = rowHeight * 2;
              }
            }
            fillableSpace -= rowHeight;
            paddingAdjust += rowHeight;
            this.vDomTop--;
            index--;
            i++;
          } else {
            working = false;
          }
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    for (let row of addedRows) {
      row.clearCellHeight();
    }
    this._quickNormalizeRowHeight(addedRows);
    if (paddingAdjust) {
      this.vDomTopPad -= paddingAdjust;
      if (this.vDomTopPad < 0) {
        this.vDomTopPad = index * this.vDomRowHeight;
      }
      if (index < 1) {
        this.vDomTopPad = 0;
      }
      table.style.paddingTop = this.vDomTopPad + "px";
      this.vDomScrollPosTop -= paddingAdjust;
    }
  }
  _removeTopRow(rows2, fillableSpace) {
    var removableRows = [], paddingAdjust = 0, i = 0, working = true;
    while (working) {
      let row = rows2[this.vDomTop], rowHeight;
      if (row && i < this.vDomMaxRenderChain) {
        rowHeight = row.getHeight() || this.vDomRowHeight;
        if (fillableSpace >= rowHeight) {
          this.vDomTop++;
          fillableSpace -= rowHeight;
          paddingAdjust += rowHeight;
          removableRows.push(row);
          i++;
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    for (let row of removableRows) {
      let rowEl = row.getElement();
      if (rowEl.parentNode) {
        rowEl.parentNode.removeChild(rowEl);
      }
    }
    if (paddingAdjust) {
      this.vDomTopPad += paddingAdjust;
      this.tableElement.style.paddingTop = this.vDomTopPad + "px";
      this.vDomScrollPosTop += this.vDomTop ? paddingAdjust : paddingAdjust + this.vDomWindowBuffer;
    }
  }
  _addBottomRow(rows2, fillableSpace) {
    var table = this.tableElement, addedRows = [], paddingAdjust = 0, index = this.vDomBottom + 1, i = 0, working = true;
    while (working) {
      let row = rows2[index], rowHeight, initialized;
      if (row && i < this.vDomMaxRenderChain) {
        rowHeight = row.getHeight() || this.vDomRowHeight;
        initialized = row.initialized;
        if (fillableSpace >= rowHeight) {
          this.styleRow(row, index);
          table.appendChild(row.getElement());
          if (!row.initialized || !row.heightInitialized) {
            addedRows.push(row);
          }
          row.initialize();
          if (!initialized) {
            rowHeight = row.getElement().offsetHeight;
            if (rowHeight > this.vDomWindowBuffer) {
              this.vDomWindowBuffer = rowHeight * 2;
            }
          }
          fillableSpace -= rowHeight;
          paddingAdjust += rowHeight;
          this.vDomBottom++;
          index++;
          i++;
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    for (let row of addedRows) {
      row.clearCellHeight();
    }
    this._quickNormalizeRowHeight(addedRows);
    if (paddingAdjust) {
      this.vDomBottomPad -= paddingAdjust;
      if (this.vDomBottomPad < 0 || index == rows2.length - 1) {
        this.vDomBottomPad = 0;
      }
      table.style.paddingBottom = this.vDomBottomPad + "px";
      this.vDomScrollPosBottom += paddingAdjust;
    }
  }
  _removeBottomRow(rows2, fillableSpace) {
    var removableRows = [], paddingAdjust = 0, i = 0, working = true;
    while (working) {
      let row = rows2[this.vDomBottom], rowHeight;
      if (row && i < this.vDomMaxRenderChain) {
        rowHeight = row.getHeight() || this.vDomRowHeight;
        if (fillableSpace >= rowHeight) {
          this.vDomBottom--;
          fillableSpace -= rowHeight;
          paddingAdjust += rowHeight;
          removableRows.push(row);
          i++;
        } else {
          working = false;
        }
      } else {
        working = false;
      }
    }
    for (let row of removableRows) {
      let rowEl = row.getElement();
      if (rowEl.parentNode) {
        rowEl.parentNode.removeChild(rowEl);
      }
    }
    if (paddingAdjust) {
      this.vDomBottomPad += paddingAdjust;
      if (this.vDomBottomPad < 0) {
        this.vDomBottomPad = 0;
      }
      this.tableElement.style.paddingBottom = this.vDomBottomPad + "px";
      this.vDomScrollPosBottom -= paddingAdjust;
    }
  }
  _quickNormalizeRowHeight(rows2) {
    for (let row of rows2) {
      row.calcHeight();
    }
    for (let row of rows2) {
      row.setCellHeight();
    }
  }
}
class RowManager extends CoreFeature {
  constructor(table) {
    super(table);
    this.element = this.createHolderElement();
    this.tableElement = this.createTableElement();
    this.heightFixer = this.createTableElement();
    this.placeholder = null;
    this.placeholderContents = null;
    this.firstRender = false;
    this.renderMode = "virtual";
    this.fixedHeight = false;
    this.rows = [];
    this.activeRowsPipeline = [];
    this.activeRows = [];
    this.activeRowsCount = 0;
    this.displayRows = [];
    this.displayRowsCount = 0;
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.redrawBlock = false;
    this.redrawBlockRestoreConfig = false;
    this.redrawBlockRenderInPosition = false;
    this.dataPipeline = [];
    this.displayPipeline = [];
    this.scrollbarWidth = 0;
    this.renderer = null;
  }
  //////////////// Setup Functions /////////////////
  createHolderElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-tableholder");
    el.setAttribute("tabindex", 0);
    return el;
  }
  createTableElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-table");
    el.setAttribute("role", "rowgroup");
    return el;
  }
  initializePlaceholder() {
    var placeholder = this.table.options.placeholder;
    if (typeof placeholder === "function") {
      placeholder = placeholder.call(this.table);
    }
    placeholder = this.chain("placeholder", [placeholder], placeholder, placeholder) || placeholder;
    if (placeholder) {
      let el = document.createElement("div");
      el.classList.add("tabulator-placeholder");
      if (typeof placeholder == "string") {
        let contents = document.createElement("div");
        contents.classList.add("tabulator-placeholder-contents");
        contents.innerHTML = placeholder;
        el.appendChild(contents);
        this.placeholderContents = contents;
      } else if (typeof HTMLElement !== "undefined" && placeholder instanceof HTMLElement) {
        el.appendChild(placeholder);
        this.placeholderContents = placeholder;
      } else {
        console.warn("Invalid placeholder provided, must be string or HTML Element", placeholder);
        this.el = null;
      }
      this.placeholder = el;
    }
  }
  //return containing element
  getElement() {
    return this.element;
  }
  //return table element
  getTableElement() {
    return this.tableElement;
  }
  initialize() {
    this.initializePlaceholder();
    this.initializeRenderer();
    this.element.appendChild(this.tableElement);
    this.firstRender = true;
    this.element.addEventListener("scroll", () => {
      var left = this.element.scrollLeft, leftDir = this.scrollLeft > left, top = this.element.scrollTop, topDir = this.scrollTop > top;
      if (this.scrollLeft != left) {
        this.scrollLeft = left;
        this.dispatch("scroll-horizontal", left, leftDir);
        this.dispatchExternal("scrollHorizontal", left, leftDir);
        this._positionPlaceholder();
      }
      if (this.scrollTop != top) {
        this.scrollTop = top;
        this.renderer.scrollRows(top, topDir);
        this.dispatch("scroll-vertical", top, topDir);
        this.dispatchExternal("scrollVertical", top, topDir);
      }
    });
  }
  ////////////////// Row Manipulation //////////////////
  findRow(subject) {
    if (typeof subject == "object") {
      if (subject instanceof Row) {
        return subject;
      } else if (subject instanceof RowComponent) {
        return subject._getSelf() || false;
      } else if (typeof HTMLElement !== "undefined" && subject instanceof HTMLElement) {
        let match2 = this.rows.find((row) => {
          return row.getElement() === subject;
        });
        return match2 || false;
      } else if (subject === null) {
        return false;
      }
    } else if (typeof subject == "undefined") {
      return false;
    } else {
      let match2 = this.rows.find((row) => {
        return row.data[this.table.options.index] == subject;
      });
      return match2 || false;
    }
    return false;
  }
  getRowFromDataObject(data) {
    var match2 = this.rows.find((row) => {
      return row.data === data;
    });
    return match2 || false;
  }
  getRowFromPosition(position) {
    return this.getDisplayRows().find((row) => {
      return row.type === "row" && row.getPosition() === position && row.isDisplayed();
    });
  }
  scrollToRow(row, position, ifVisible) {
    return this.renderer.scrollToRowPosition(row, position, ifVisible);
  }
  ////////////////// Data Handling //////////////////
  setData(data, renderInPosition, columnsChanged) {
    return new Promise((resolve, reject) => {
      if (renderInPosition && this.getDisplayRows().length) {
        if (this.table.options.pagination) {
          this._setDataActual(data, true);
        } else {
          this.reRenderInPosition(() => {
            this._setDataActual(data);
          });
        }
      } else {
        if (this.table.options.autoColumns && columnsChanged && this.table.initialized) {
          this.table.columnManager.generateColumnsFromRowData(data);
        }
        this.resetScroll();
        this._setDataActual(data);
      }
      resolve();
    });
  }
  _setDataActual(data, renderInPosition) {
    this.dispatchExternal("dataProcessing", data);
    this._wipeElements();
    if (Array.isArray(data)) {
      this.dispatch("data-processing", data);
      data.forEach((def, i) => {
        if (def && typeof def === "object") {
          var row = new Row(def, this);
          this.rows.push(row);
        } else {
          console.warn("Data Loading Warning - Invalid row data detected and ignored, expecting object but received:", def);
        }
      });
      this.refreshActiveData(false, false, renderInPosition);
      this.dispatch("data-processed", data);
      this.dispatchExternal("dataProcessed", data);
    } else {
      console.error("Data Loading Error - Unable to process data due to invalid data type \nExpecting: array \nReceived: ", typeof data, "\nData:     ", data);
    }
  }
  _wipeElements() {
    this.dispatch("rows-wipe");
    this.destroy();
    this.adjustTableSize();
    this.dispatch("rows-wiped");
  }
  destroy() {
    this.rows.forEach((row) => {
      row.wipe();
    });
    this.rows = [];
    this.activeRows = [];
    this.activeRowsPipeline = [];
    this.activeRowsCount = 0;
    this.displayRows = [];
    this.displayRowsCount = 0;
  }
  deleteRow(row, blockRedraw) {
    var allIndex = this.rows.indexOf(row), activeIndex = this.activeRows.indexOf(row);
    if (activeIndex > -1) {
      this.activeRows.splice(activeIndex, 1);
    }
    if (allIndex > -1) {
      this.rows.splice(allIndex, 1);
    }
    this.setActiveRows(this.activeRows);
    this.displayRowIterator((rows2) => {
      var displayIndex = rows2.indexOf(row);
      if (displayIndex > -1) {
        rows2.splice(displayIndex, 1);
      }
    });
    if (!blockRedraw) {
      this.reRenderInPosition();
    }
    this.regenerateRowPositions();
    this.dispatchExternal("rowDeleted", row.getComponent());
    if (!this.displayRowsCount) {
      this.tableEmpty();
    }
    if (this.subscribedExternal("dataChanged")) {
      this.dispatchExternal("dataChanged", this.getData());
    }
  }
  addRow(data, pos, index, blockRedraw) {
    var row = this.addRowActual(data, pos, index, blockRedraw);
    return row;
  }
  //add multiple rows
  addRows(data, pos, index, refreshDisplayOnly) {
    var rows2 = [];
    return new Promise((resolve, reject) => {
      pos = this.findAddRowPos(pos);
      if (!Array.isArray(data)) {
        data = [data];
      }
      if (typeof index == "undefined" && pos || typeof index !== "undefined" && !pos) {
        data.reverse();
      }
      data.forEach((item, i) => {
        var row = this.addRow(item, pos, index, true);
        rows2.push(row);
        this.dispatch("row-added", row, item, pos, index);
      });
      this.refreshActiveData(refreshDisplayOnly ? "displayPipeline" : false, false, true);
      this.regenerateRowPositions();
      if (this.displayRowsCount) {
        this._clearPlaceholder();
      }
      resolve(rows2);
    });
  }
  findAddRowPos(pos) {
    if (typeof pos === "undefined") {
      pos = this.table.options.addRowPos;
    }
    if (pos === "pos") {
      pos = true;
    }
    if (pos === "bottom") {
      pos = false;
    }
    return pos;
  }
  addRowActual(data, pos, index, blockRedraw) {
    var row = data instanceof Row ? data : new Row(data || {}, this), top = this.findAddRowPos(pos), allIndex = -1, activeIndex, chainResult;
    if (!index) {
      chainResult = this.chain("row-adding-position", [row, top], null, { index, top });
      index = chainResult.index;
      top = chainResult.top;
    }
    if (typeof index !== "undefined") {
      index = this.findRow(index);
    }
    index = this.chain("row-adding-index", [row, index, top], null, index);
    if (index) {
      allIndex = this.rows.indexOf(index);
    }
    if (index && allIndex > -1) {
      activeIndex = this.activeRows.indexOf(index);
      this.displayRowIterator(function(rows2) {
        var displayIndex = rows2.indexOf(index);
        if (displayIndex > -1) {
          rows2.splice(top ? displayIndex : displayIndex + 1, 0, row);
        }
      });
      if (activeIndex > -1) {
        this.activeRows.splice(top ? activeIndex : activeIndex + 1, 0, row);
      }
      this.rows.splice(top ? allIndex : allIndex + 1, 0, row);
    } else {
      if (top) {
        this.displayRowIterator(function(rows2) {
          rows2.unshift(row);
        });
        this.activeRows.unshift(row);
        this.rows.unshift(row);
      } else {
        this.displayRowIterator(function(rows2) {
          rows2.push(row);
        });
        this.activeRows.push(row);
        this.rows.push(row);
      }
    }
    this.setActiveRows(this.activeRows);
    this.dispatchExternal("rowAdded", row.getComponent());
    if (this.subscribedExternal("dataChanged")) {
      this.dispatchExternal("dataChanged", this.table.rowManager.getData());
    }
    if (!blockRedraw) {
      this.reRenderInPosition();
    }
    return row;
  }
  moveRow(from, to, after) {
    this.dispatch("row-move", from, to, after);
    this.moveRowActual(from, to, after);
    this.regenerateRowPositions();
    this.dispatch("row-moved", from, to, after);
    this.dispatchExternal("rowMoved", from.getComponent());
  }
  moveRowActual(from, to, after) {
    this.moveRowInArray(this.rows, from, to, after);
    this.moveRowInArray(this.activeRows, from, to, after);
    this.displayRowIterator((rows2) => {
      this.moveRowInArray(rows2, from, to, after);
    });
    this.dispatch("row-moving", from, to, after);
  }
  moveRowInArray(rows2, from, to, after) {
    var fromIndex, toIndex, start, end;
    if (from !== to) {
      fromIndex = rows2.indexOf(from);
      if (fromIndex > -1) {
        rows2.splice(fromIndex, 1);
        toIndex = rows2.indexOf(to);
        if (toIndex > -1) {
          if (after) {
            rows2.splice(toIndex + 1, 0, from);
          } else {
            rows2.splice(toIndex, 0, from);
          }
        } else {
          rows2.splice(fromIndex, 0, from);
        }
      }
      if (rows2 === this.getDisplayRows()) {
        start = fromIndex < toIndex ? fromIndex : toIndex;
        end = toIndex > fromIndex ? toIndex : fromIndex + 1;
        for (let i = start; i <= end; i++) {
          if (rows2[i]) {
            this.styleRow(rows2[i], i);
          }
        }
      }
    }
  }
  clearData() {
    this.setData([]);
  }
  getRowIndex(row) {
    return this.findRowIndex(row, this.rows);
  }
  getDisplayRowIndex(row) {
    var index = this.getDisplayRows().indexOf(row);
    return index > -1 ? index : false;
  }
  nextDisplayRow(row, rowOnly) {
    var index = this.getDisplayRowIndex(row), nextRow = false;
    if (index !== false && index < this.displayRowsCount - 1) {
      nextRow = this.getDisplayRows()[index + 1];
    }
    if (nextRow && (!(nextRow instanceof Row) || nextRow.type != "row")) {
      return this.nextDisplayRow(nextRow, rowOnly);
    }
    return nextRow;
  }
  prevDisplayRow(row, rowOnly) {
    var index = this.getDisplayRowIndex(row), prevRow = false;
    if (index) {
      prevRow = this.getDisplayRows()[index - 1];
    }
    if (rowOnly && prevRow && (!(prevRow instanceof Row) || prevRow.type != "row")) {
      return this.prevDisplayRow(prevRow, rowOnly);
    }
    return prevRow;
  }
  findRowIndex(row, list) {
    var rowIndex;
    row = this.findRow(row);
    if (row) {
      rowIndex = list.indexOf(row);
      if (rowIndex > -1) {
        return rowIndex;
      }
    }
    return false;
  }
  getData(active, transform) {
    var output = [], rows2 = this.getRows(active);
    rows2.forEach(function(row) {
      if (row.type == "row") {
        output.push(row.getData(transform || "data"));
      }
    });
    return output;
  }
  getComponents(active) {
    var output = [], rows2 = this.getRows(active);
    rows2.forEach(function(row) {
      output.push(row.getComponent());
    });
    return output;
  }
  getDataCount(active) {
    var rows2 = this.getRows(active);
    return rows2.length;
  }
  scrollHorizontal(left) {
    this.scrollLeft = left;
    this.element.scrollLeft = left;
    this.dispatch("scroll-horizontal", left);
  }
  registerDataPipelineHandler(handler, priority) {
    if (typeof priority !== "undefined") {
      this.dataPipeline.push({ handler, priority });
      this.dataPipeline.sort((a, b) => {
        return a.priority - b.priority;
      });
    } else {
      console.error("Data pipeline handlers must have a priority in order to be registered");
    }
  }
  registerDisplayPipelineHandler(handler, priority) {
    if (typeof priority !== "undefined") {
      this.displayPipeline.push({ handler, priority });
      this.displayPipeline.sort((a, b) => {
        return a.priority - b.priority;
      });
    } else {
      console.error("Display pipeline handlers must have a priority in order to be registered");
    }
  }
  //set active data set
  refreshActiveData(handler, skipStage, renderInPosition) {
    var table = this.table, stage = "", index = 0, cascadeOrder = ["all", "dataPipeline", "display", "displayPipeline", "end"];
    if (!this.table.destroyed) {
      if (typeof handler === "function") {
        index = this.dataPipeline.findIndex((item) => {
          return item.handler === handler;
        });
        if (index > -1) {
          stage = "dataPipeline";
          if (skipStage) {
            if (index == this.dataPipeline.length - 1) {
              stage = "display";
            } else {
              index++;
            }
          }
        } else {
          index = this.displayPipeline.findIndex((item) => {
            return item.handler === handler;
          });
          if (index > -1) {
            stage = "displayPipeline";
            if (skipStage) {
              if (index == this.displayPipeline.length - 1) {
                stage = "end";
              } else {
                index++;
              }
            }
          } else {
            console.error("Unable to refresh data, invalid handler provided", handler);
            return;
          }
        }
      } else {
        stage = handler || "all";
        index = 0;
      }
      if (this.redrawBlock) {
        if (!this.redrawBlockRestoreConfig || this.redrawBlockRestoreConfig && (this.redrawBlockRestoreConfig.stage === stage && index < this.redrawBlockRestoreConfig.index || cascadeOrder.indexOf(stage) < cascadeOrder.indexOf(this.redrawBlockRestoreConfig.stage))) {
          this.redrawBlockRestoreConfig = {
            handler,
            skipStage,
            renderInPosition,
            stage,
            index
          };
        }
        return;
      } else {
        if (Helpers.elVisible(this.element)) {
          if (renderInPosition) {
            this.reRenderInPosition(this.refreshPipelines.bind(this, handler, stage, index, renderInPosition));
          } else {
            this.refreshPipelines(handler, stage, index, renderInPosition);
            if (!handler) {
              this.table.columnManager.renderer.renderColumns();
            }
            this.renderTable();
            if (table.options.layoutColumnsOnNewData) {
              this.table.columnManager.redraw(true);
            }
          }
        } else {
          this.refreshPipelines(handler, stage, index, renderInPosition);
        }
        this.dispatch("data-refreshed");
      }
    }
  }
  refreshPipelines(handler, stage, index, renderInPosition) {
    this.dispatch("data-refreshing");
    if (!handler || !this.activeRowsPipeline[0]) {
      this.activeRowsPipeline[0] = this.rows.slice(0);
    }
    switch (stage) {
      case "all":
      //handle case where all data needs refreshing
      case "dataPipeline":
        for (let i = index; i < this.dataPipeline.length; i++) {
          let result = this.dataPipeline[i].handler(this.activeRowsPipeline[i].slice(0));
          this.activeRowsPipeline[i + 1] = result || this.activeRowsPipeline[i].slice(0);
        }
        this.setActiveRows(this.activeRowsPipeline[this.dataPipeline.length]);
      case "display":
        index = 0;
        this.resetDisplayRows();
      case "displayPipeline":
        for (let i = index; i < this.displayPipeline.length; i++) {
          let result = this.displayPipeline[i].handler((i ? this.getDisplayRows(i - 1) : this.activeRows).slice(0), renderInPosition);
          this.setDisplayRows(result || this.getDisplayRows(i - 1).slice(0), i);
        }
      case "end":
        this.regenerateRowPositions();
    }
    if (this.getDisplayRows().length) {
      this._clearPlaceholder();
    }
  }
  //regenerate row positions
  regenerateRowPositions() {
    var rows2 = this.getDisplayRows();
    var index = 1;
    rows2.forEach((row) => {
      if (row.type === "row") {
        row.setPosition(index);
        index++;
      }
    });
  }
  setActiveRows(activeRows) {
    this.activeRows = this.activeRows = Object.assign([], activeRows);
    this.activeRowsCount = this.activeRows.length;
  }
  //reset display rows array
  resetDisplayRows() {
    this.displayRows = [];
    this.displayRows.push(this.activeRows.slice(0));
    this.displayRowsCount = this.displayRows[0].length;
  }
  //set display row pipeline data
  setDisplayRows(displayRows, index) {
    this.displayRows[index] = displayRows;
    if (index == this.displayRows.length - 1) {
      this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length;
    }
  }
  getDisplayRows(index) {
    if (typeof index == "undefined") {
      return this.displayRows.length ? this.displayRows[this.displayRows.length - 1] : [];
    } else {
      return this.displayRows[index] || [];
    }
  }
  getVisibleRows(chain, viewable) {
    var rows2 = Object.assign([], this.renderer.visibleRows(!viewable));
    if (chain) {
      rows2 = this.chain("rows-visible", [viewable], rows2, rows2);
    }
    return rows2;
  }
  //repeat action across display rows
  displayRowIterator(callback) {
    this.activeRowsPipeline.forEach(callback);
    this.displayRows.forEach(callback);
    this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length;
  }
  //return only actual rows (not group headers etc)
  getRows(type) {
    var rows2 = [];
    switch (type) {
      case "active":
        rows2 = this.activeRows;
        break;
      case "display":
        rows2 = this.table.rowManager.getDisplayRows();
        break;
      case "visible":
        rows2 = this.getVisibleRows(false, true);
        break;
      default:
        rows2 = this.chain("rows-retrieve", type, null, this.rows) || this.rows;
    }
    return rows2;
  }
  ///////////////// Table Rendering /////////////////
  //trigger rerender of table in current position
  reRenderInPosition(callback) {
    if (this.redrawBlock) {
      if (callback) {
        callback();
      } else {
        this.redrawBlockRenderInPosition = true;
      }
    } else {
      this.dispatchExternal("renderStarted");
      this.renderer.rerenderRows(callback);
      if (!this.fixedHeight) {
        this.adjustTableSize();
      }
      this.scrollBarCheck();
      this.dispatchExternal("renderComplete");
    }
  }
  scrollBarCheck() {
    var scrollbarWidth = 0;
    if (this.element.scrollHeight > this.element.clientHeight) {
      scrollbarWidth = this.element.offsetWidth - this.element.clientWidth;
    }
    if (scrollbarWidth !== this.scrollbarWidth) {
      this.scrollbarWidth = scrollbarWidth;
      this.dispatch("scrollbar-vertical", scrollbarWidth);
    }
  }
  initializeRenderer() {
    var renderClass;
    var renderers = {
      "virtual": VirtualDomVertical,
      "basic": BasicVertical
    };
    if (typeof this.table.options.renderVertical === "string") {
      renderClass = renderers[this.table.options.renderVertical];
    } else {
      renderClass = this.table.options.renderVertical;
    }
    if (renderClass) {
      this.renderMode = this.table.options.renderVertical;
      this.renderer = new renderClass(this.table, this.element, this.tableElement);
      this.renderer.initialize();
      if ((this.table.element.clientHeight || this.table.options.height) && !(this.table.options.minHeight && this.table.options.maxHeight)) {
        this.fixedHeight = true;
      } else {
        this.fixedHeight = false;
      }
    } else {
      console.error("Unable to find matching renderer:", this.table.options.renderVertical);
    }
  }
  getRenderMode() {
    return this.renderMode;
  }
  renderTable() {
    this.dispatchExternal("renderStarted");
    this.element.scrollTop = 0;
    this._clearTable();
    if (this.displayRowsCount) {
      this.renderer.renderRows();
      if (this.firstRender) {
        this.firstRender = false;
        if (!this.fixedHeight) {
          this.adjustTableSize();
        }
        this.layoutRefresh(true);
      }
    } else {
      this.renderEmptyScroll();
    }
    if (!this.fixedHeight) {
      this.adjustTableSize();
    }
    this.dispatch("table-layout");
    if (!this.displayRowsCount) {
      this._showPlaceholder();
    }
    this.scrollBarCheck();
    this.dispatchExternal("renderComplete");
  }
  //show scrollbars on empty table div
  renderEmptyScroll() {
    if (this.placeholder) {
      this.tableElement.style.display = "none";
    } else {
      this.tableElement.style.minWidth = this.table.columnManager.getWidth() + "px";
    }
  }
  _clearTable() {
    this._clearPlaceholder();
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.renderer.clearRows();
  }
  tableEmpty() {
    this.renderEmptyScroll();
    this._showPlaceholder();
  }
  checkPlaceholder() {
    if (this.displayRowsCount) {
      this._clearPlaceholder();
    } else {
      this.tableEmpty();
    }
  }
  _showPlaceholder() {
    if (this.placeholder) {
      if (this.placeholder && this.placeholder.parentNode) {
        this.placeholder.parentNode.removeChild(this.placeholder);
      }
      this.initializePlaceholder();
      this.placeholder.setAttribute("tabulator-render-mode", this.renderMode);
      this.getElement().appendChild(this.placeholder);
      this._positionPlaceholder();
      this.adjustTableSize();
    }
  }
  _clearPlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
    this.tableElement.style.minWidth = "";
    this.tableElement.style.display = "";
  }
  _positionPlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.style.width = this.table.columnManager.getWidth() + "px";
      this.placeholderContents.style.width = this.table.rowManager.element.clientWidth + "px";
      this.placeholderContents.style.marginLeft = this.scrollLeft + "px";
    }
  }
  styleRow(row, index) {
    var rowEl = row.getElement();
    if (index % 2) {
      rowEl.classList.add("tabulator-row-even");
      rowEl.classList.remove("tabulator-row-odd");
    } else {
      rowEl.classList.add("tabulator-row-odd");
      rowEl.classList.remove("tabulator-row-even");
    }
  }
  //normalize height of active rows
  normalizeHeight(force) {
    this.activeRows.forEach(function(row) {
      row.normalizeHeight(force);
    });
  }
  //adjust the height of the table holder to fit in the Tabulator element
  adjustTableSize() {
    let initialHeight = this.element.clientHeight, minHeight;
    let resized = false;
    if (this.renderer.verticalFillMode === "fill") {
      let otherHeight = Math.floor(this.table.columnManager.getElement().getBoundingClientRect().height + (this.table.footerManager && this.table.footerManager.active && !this.table.footerManager.external ? this.table.footerManager.getElement().getBoundingClientRect().height : 0));
      if (this.fixedHeight) {
        minHeight = isNaN(this.table.options.minHeight) ? this.table.options.minHeight : this.table.options.minHeight + "px";
        const height = "calc(100% - " + otherHeight + "px)";
        this.element.style.minHeight = minHeight || "calc(100% - " + otherHeight + "px)";
        this.element.style.height = height;
        this.element.style.maxHeight = height;
      } else {
        this.element.style.height = "";
        this.element.style.height = this.table.element.clientHeight - otherHeight + "px";
        this.element.scrollTop = this.scrollTop;
      }
      this.renderer.resize();
      if (!this.fixedHeight && initialHeight != this.element.clientHeight) {
        resized = true;
        if (this.subscribed("table-resize")) {
          this.dispatch("table-resize");
        } else {
          this.redraw();
        }
      }
      this.scrollBarCheck();
    }
    this._positionPlaceholder();
    return resized;
  }
  //reinitialize all rows
  reinitialize() {
    this.rows.forEach(function(row) {
      row.reinitialize(true);
    });
  }
  //prevent table from being redrawn
  blockRedraw() {
    this.redrawBlock = true;
    this.redrawBlockRestoreConfig = false;
  }
  //restore table redrawing
  restoreRedraw() {
    this.redrawBlock = false;
    if (this.redrawBlockRestoreConfig) {
      this.refreshActiveData(this.redrawBlockRestoreConfig.handler, this.redrawBlockRestoreConfig.skipStage, this.redrawBlockRestoreConfig.renderInPosition);
      this.redrawBlockRestoreConfig = false;
    } else {
      if (this.redrawBlockRenderInPosition) {
        this.reRenderInPosition();
      }
    }
    this.redrawBlockRenderInPosition = false;
  }
  //redraw table
  redraw(force) {
    this.adjustTableSize();
    this.table.tableWidth = this.table.element.clientWidth;
    if (!force) {
      this.reRenderInPosition();
      this.scrollHorizontal(this.scrollLeft);
    } else {
      this.renderTable();
    }
  }
  resetScroll() {
    this.element.scrollLeft = 0;
    this.element.scrollTop = 0;
    if (this.table.browser === "ie") {
      var event = document.createEvent("Event");
      event.initEvent("scroll", false, true);
      this.element.dispatchEvent(event);
    } else {
      this.element.dispatchEvent(new Event("scroll"));
    }
  }
}
class FooterManager extends CoreFeature {
  constructor(table) {
    super(table);
    this.active = false;
    this.element = this.createElement();
    this.containerElement = this.createContainerElement();
    this.external = false;
  }
  initialize() {
    this.initializeElement();
  }
  createElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-footer");
    return el;
  }
  createContainerElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-footer-contents");
    this.element.appendChild(el);
    return el;
  }
  initializeElement() {
    if (this.table.options.footerElement) {
      switch (typeof this.table.options.footerElement) {
        case "string":
          if (this.table.options.footerElement[0] === "<") {
            this.containerElement.innerHTML = this.table.options.footerElement;
          } else {
            this.external = true;
            this.containerElement = document.querySelector(this.table.options.footerElement);
          }
          break;
        default:
          this.element = this.table.options.footerElement;
          break;
      }
    }
  }
  getElement() {
    return this.element;
  }
  append(element) {
    this.activate();
    this.containerElement.appendChild(element);
    this.table.rowManager.adjustTableSize();
  }
  prepend(element) {
    this.activate();
    this.element.insertBefore(element, this.element.firstChild);
    this.table.rowManager.adjustTableSize();
  }
  remove(element) {
    element.parentNode.removeChild(element);
    this.deactivate();
  }
  deactivate(force) {
    if (!this.element.firstChild || force) {
      if (!this.external) {
        this.element.parentNode.removeChild(this.element);
      }
      this.active = false;
    }
  }
  activate() {
    if (!this.active) {
      this.active = true;
      if (!this.external) {
        this.table.element.appendChild(this.getElement());
        this.table.element.style.display = "";
      }
    }
  }
  redraw() {
    this.dispatch("footer-redraw");
  }
}
class InteractionManager extends CoreFeature {
  constructor(table) {
    super(table);
    this.el = null;
    this.abortClasses = ["tabulator-headers", "tabulator-table"];
    this.previousTargets = {};
    this.listeners = [
      "click",
      "dblclick",
      "contextmenu",
      "mouseenter",
      "mouseleave",
      "mouseover",
      "mouseout",
      "mousemove",
      "mouseup",
      "mousedown",
      "touchstart",
      "touchend"
    ];
    this.componentMap = {
      "tabulator-cell": "cell",
      "tabulator-row": "row",
      "tabulator-group": "group",
      "tabulator-col": "column"
    };
    this.pseudoTrackers = {
      "row": {
        subscriber: null,
        target: null
      },
      "cell": {
        subscriber: null,
        target: null
      },
      "group": {
        subscriber: null,
        target: null
      },
      "column": {
        subscriber: null,
        target: null
      }
    };
    this.pseudoTracking = false;
  }
  initialize() {
    this.el = this.table.element;
    this.buildListenerMap();
    this.bindSubscriptionWatchers();
  }
  buildListenerMap() {
    var listenerMap = {};
    this.listeners.forEach((listener) => {
      listenerMap[listener] = {
        handler: null,
        components: []
      };
    });
    this.listeners = listenerMap;
  }
  bindPseudoEvents() {
    Object.keys(this.pseudoTrackers).forEach((key) => {
      this.pseudoTrackers[key].subscriber = this.pseudoMouseEnter.bind(this, key);
      this.subscribe(key + "-mouseover", this.pseudoTrackers[key].subscriber);
    });
    this.pseudoTracking = true;
  }
  pseudoMouseEnter(key, e, target) {
    if (this.pseudoTrackers[key].target !== target) {
      if (this.pseudoTrackers[key].target) {
        this.dispatch(key + "-mouseleave", e, this.pseudoTrackers[key].target);
      }
      this.pseudoMouseLeave(key, e);
      this.pseudoTrackers[key].target = target;
      this.dispatch(key + "-mouseenter", e, target);
    }
  }
  pseudoMouseLeave(key, e) {
    var leaveList = Object.keys(this.pseudoTrackers), linkedKeys = {
      "row": ["cell"],
      "cell": ["row"]
    };
    leaveList = leaveList.filter((item) => {
      var links = linkedKeys[key];
      return item !== key && (!links || links && !links.includes(item));
    });
    leaveList.forEach((key2) => {
      var target = this.pseudoTrackers[key2].target;
      if (this.pseudoTrackers[key2].target) {
        this.dispatch(key2 + "-mouseleave", e, target);
        this.pseudoTrackers[key2].target = null;
      }
    });
  }
  bindSubscriptionWatchers() {
    var listeners = Object.keys(this.listeners), components = Object.values(this.componentMap);
    for (let comp of components) {
      for (let listener of listeners) {
        let key = comp + "-" + listener;
        this.subscriptionChange(key, this.subscriptionChanged.bind(this, comp, listener));
      }
    }
    this.subscribe("table-destroy", this.clearWatchers.bind(this));
  }
  subscriptionChanged(component, key, added) {
    var listener = this.listeners[key].components, index = listener.indexOf(component), changed = false;
    if (added) {
      if (index === -1) {
        listener.push(component);
        changed = true;
      }
    } else {
      if (!this.subscribed(component + "-" + key)) {
        if (index > -1) {
          listener.splice(index, 1);
          changed = true;
        }
      }
    }
    if ((key === "mouseenter" || key === "mouseleave") && !this.pseudoTracking) {
      this.bindPseudoEvents();
    }
    if (changed) {
      this.updateEventListeners();
    }
  }
  updateEventListeners() {
    for (let key in this.listeners) {
      let listener = this.listeners[key];
      if (listener.components.length) {
        if (!listener.handler) {
          listener.handler = this.track.bind(this, key);
          this.el.addEventListener(key, listener.handler);
        }
      } else {
        if (listener.handler) {
          this.el.removeEventListener(key, listener.handler);
          listener.handler = null;
        }
      }
    }
  }
  track(type, e) {
    var path = e.composedPath && e.composedPath() || e.path;
    var targets = this.findTargets(path);
    targets = this.bindComponents(type, targets);
    this.triggerEvents(type, e, targets);
    if (this.pseudoTracking && (type == "mouseover" || type == "mouseleave") && !Object.keys(targets).length) {
      this.pseudoMouseLeave("none", e);
    }
  }
  findTargets(path) {
    var targets = {};
    let componentMap = Object.keys(this.componentMap);
    for (let el of path) {
      let classList = el.classList ? [...el.classList] : [];
      let abort = classList.filter((item) => {
        return this.abortClasses.includes(item);
      });
      if (abort.length) {
        break;
      }
      let elTargets = classList.filter((item) => {
        return componentMap.includes(item);
      });
      for (let target of elTargets) {
        if (!targets[this.componentMap[target]]) {
          targets[this.componentMap[target]] = el;
        }
      }
    }
    if (targets.group && targets.group === targets.row) {
      delete targets.row;
    }
    return targets;
  }
  bindComponents(type, targets) {
    var keys = Object.keys(targets).reverse(), listener = this.listeners[type], matches = {}, output = {}, targetMatches = {};
    for (let key of keys) {
      let component, target = targets[key], previousTarget = this.previousTargets[key];
      if (previousTarget && previousTarget.target === target) {
        component = previousTarget.component;
      } else {
        switch (key) {
          case "row":
          case "group":
            if (listener.components.includes("row") || listener.components.includes("cell") || listener.components.includes("group")) {
              let rows2 = this.table.rowManager.getVisibleRows(true);
              component = rows2.find((row) => {
                return row.getElement() === target;
              });
              if (targets["row"] && targets["row"].parentNode && targets["row"].parentNode.closest(".tabulator-row")) {
                targets[key] = false;
              }
            }
            break;
          case "column":
            if (listener.components.includes("column")) {
              component = this.table.columnManager.findColumn(target);
            }
            break;
          case "cell":
            if (listener.components.includes("cell")) {
              if (matches["row"] instanceof Row) {
                component = matches["row"].findCell(target);
              } else {
                if (targets["row"]) {
                  console.warn("Event Target Lookup Error - The row this cell is attached to cannot be found, has the table been reinitialized without being destroyed first?");
                }
              }
            }
            break;
        }
      }
      if (component) {
        matches[key] = component;
        targetMatches[key] = {
          target,
          component
        };
      }
    }
    this.previousTargets = targetMatches;
    Object.keys(targets).forEach((key) => {
      let value = matches[key];
      output[key] = value;
    });
    return output;
  }
  triggerEvents(type, e, targets) {
    var listener = this.listeners[type];
    for (let key in targets) {
      if (targets[key] && listener.components.includes(key)) {
        this.dispatch(key + "-" + type, e, targets[key]);
      }
    }
  }
  clearWatchers() {
    for (let key in this.listeners) {
      let listener = this.listeners[key];
      if (listener.handler) {
        this.el.removeEventListener(key, listener.handler);
        listener.handler = null;
      }
    }
  }
}
class ComponentFunctionBinder {
  constructor(table) {
    this.table = table;
    this.bindings = {};
  }
  bind(type, funcName, handler) {
    if (!this.bindings[type]) {
      this.bindings[type] = {};
    }
    if (this.bindings[type][funcName]) {
      console.warn("Unable to bind component handler, a matching function name is already bound", type, funcName, handler);
    } else {
      this.bindings[type][funcName] = handler;
    }
  }
  handle(type, component, name) {
    if (this.bindings[type] && this.bindings[type][name] && typeof this.bindings[type][name].bind === "function") {
      return this.bindings[type][name].bind(null, component);
    } else {
      if (name !== "then" && typeof name === "string" && !name.startsWith("_")) {
        if (this.table.options.debugInvalidComponentFuncs) {
          console.error("The " + type + " component does not have a " + name + " function, have you checked that you have the correct Tabulator module installed?");
        }
      }
    }
  }
}
class DataLoader extends CoreFeature {
  constructor(table) {
    super(table);
    this.requestOrder = 0;
    this.loading = false;
  }
  initialize() {
  }
  load(data, params, config, replace, silent, columnsChanged) {
    var requestNo = ++this.requestOrder;
    if (this.table.destroyed) {
      return Promise.resolve();
    }
    this.dispatchExternal("dataLoading", data);
    if (data && (data.indexOf("{") == 0 || data.indexOf("[") == 0)) {
      data = JSON.parse(data);
    }
    if (this.confirm("data-loading", [data, params, config, silent])) {
      this.loading = true;
      if (!silent) {
        this.alertLoader();
      }
      params = this.chain("data-params", [data, config, silent], params || {}, params || {});
      params = this.mapParams(params, this.table.options.dataSendParams);
      var result = this.chain("data-load", [data, params, config, silent], false, Promise.resolve([]));
      return result.then((response) => {
        if (!this.table.destroyed) {
          if (!Array.isArray(response) && typeof response == "object") {
            response = this.mapParams(response, this.objectInvert(this.table.options.dataReceiveParams));
          }
          var rowData = this.chain("data-loaded", [response], null, response);
          if (requestNo == this.requestOrder) {
            this.clearAlert();
            if (rowData !== false) {
              this.dispatchExternal("dataLoaded", rowData);
              this.table.rowManager.setData(rowData, replace, typeof columnsChanged === "undefined" ? !replace : columnsChanged);
            }
          } else {
            console.warn("Data Load Response Blocked - An active data load request was blocked by an attempt to change table data while the request was being made");
          }
        } else {
          console.warn("Data Load Response Blocked - Table has been destroyed");
        }
      }).catch((error) => {
        console.error("Data Load Error: ", error);
        this.dispatchExternal("dataLoadError", error);
        if (!silent) {
          this.alertError();
        }
        setTimeout(() => {
          this.clearAlert();
        }, this.table.options.dataLoaderErrorTimeout);
      }).finally(() => {
        this.loading = false;
      });
    } else {
      this.dispatchExternal("dataLoaded", data);
      if (!data) {
        data = [];
      }
      this.table.rowManager.setData(data, replace, typeof columnsChanged === "undefined" ? !replace : columnsChanged);
      return Promise.resolve();
    }
  }
  mapParams(params, map) {
    var output = {};
    for (let key in params) {
      output[map.hasOwnProperty(key) ? map[key] : key] = params[key];
    }
    return output;
  }
  objectInvert(obj) {
    var output = {};
    for (let key in obj) {
      output[obj[key]] = key;
    }
    return output;
  }
  blockActiveLoad() {
    this.requestOrder++;
  }
  alertLoader() {
    var shouldLoad = typeof this.table.options.dataLoader === "function" ? this.table.options.dataLoader() : this.table.options.dataLoader;
    if (shouldLoad) {
      this.table.alertManager.alert(this.table.options.dataLoaderLoading || this.langText("data|loading"));
    }
  }
  alertError() {
    this.table.alertManager.alert(this.table.options.dataLoaderError || this.langText("data|error"), "error");
  }
  clearAlert() {
    this.table.alertManager.clear();
  }
}
class ExternalEventBus {
  constructor(table, optionsList, debug) {
    this.table = table;
    this.events = {};
    this.optionsList = optionsList || {};
    this.subscriptionNotifiers = {};
    this.dispatch = debug ? this._debugDispatch.bind(this) : this._dispatch.bind(this);
    this.debug = debug;
  }
  subscriptionChange(key, callback) {
    if (!this.subscriptionNotifiers[key]) {
      this.subscriptionNotifiers[key] = [];
    }
    this.subscriptionNotifiers[key].push(callback);
    if (this.subscribed(key)) {
      this._notifySubscriptionChange(key, true);
    }
  }
  subscribe(key, callback) {
    if (!this.events[key]) {
      this.events[key] = [];
    }
    this.events[key].push(callback);
    this._notifySubscriptionChange(key, true);
  }
  unsubscribe(key, callback) {
    var index;
    if (this.events[key]) {
      if (callback) {
        index = this.events[key].findIndex((item) => {
          return item === callback;
        });
        if (index > -1) {
          this.events[key].splice(index, 1);
        } else {
          console.warn("Cannot remove event, no matching event found:", key, callback);
          return;
        }
      } else {
        delete this.events[key];
      }
    } else {
      console.warn("Cannot remove event, no events set on:", key);
      return;
    }
    this._notifySubscriptionChange(key, false);
  }
  subscribed(key) {
    return this.events[key] && this.events[key].length;
  }
  _notifySubscriptionChange(key, subscribed) {
    var notifiers = this.subscriptionNotifiers[key];
    if (notifiers) {
      notifiers.forEach((callback) => {
        callback(subscribed);
      });
    }
  }
  _dispatch() {
    var args = Array.from(arguments), key = args.shift(), result;
    if (this.events[key]) {
      this.events[key].forEach((callback, i) => {
        let callResult = callback.apply(this.table, args);
        if (!i) {
          result = callResult;
        }
      });
    }
    return result;
  }
  _debugDispatch() {
    var args = Array.from(arguments), key = args[0];
    args[0] = "ExternalEvent:" + args[0];
    if (this.debug === true || this.debug.includes(key)) {
      console.log(...args);
    }
    return this._dispatch(...arguments);
  }
}
class InternalEventBus {
  constructor(debug) {
    this.events = {};
    this.subscriptionNotifiers = {};
    this.dispatch = debug ? this._debugDispatch.bind(this) : this._dispatch.bind(this);
    this.chain = debug ? this._debugChain.bind(this) : this._chain.bind(this);
    this.confirm = debug ? this._debugConfirm.bind(this) : this._confirm.bind(this);
    this.debug = debug;
  }
  subscriptionChange(key, callback) {
    if (!this.subscriptionNotifiers[key]) {
      this.subscriptionNotifiers[key] = [];
    }
    this.subscriptionNotifiers[key].push(callback);
    if (this.subscribed(key)) {
      this._notifySubscriptionChange(key, true);
    }
  }
  subscribe(key, callback, priority = 1e4) {
    if (!this.events[key]) {
      this.events[key] = [];
    }
    this.events[key].push({ callback, priority });
    this.events[key].sort((a, b) => {
      return a.priority - b.priority;
    });
    this._notifySubscriptionChange(key, true);
  }
  unsubscribe(key, callback) {
    var index;
    if (this.events[key]) {
      if (callback) {
        index = this.events[key].findIndex((item) => {
          return item.callback === callback;
        });
        if (index > -1) {
          this.events[key].splice(index, 1);
        } else {
          console.warn("Cannot remove event, no matching event found:", key, callback);
          return;
        }
      }
    } else {
      console.warn("Cannot remove event, no events set on:", key);
      return;
    }
    this._notifySubscriptionChange(key, false);
  }
  subscribed(key) {
    return this.events[key] && this.events[key].length;
  }
  _chain(key, args, initialValue, fallback) {
    var value = initialValue;
    if (!Array.isArray(args)) {
      args = [args];
    }
    if (this.subscribed(key)) {
      this.events[key].forEach((subscriber, i) => {
        value = subscriber.callback.apply(this, args.concat([value]));
      });
      return value;
    } else {
      return typeof fallback === "function" ? fallback() : fallback;
    }
  }
  _confirm(key, args) {
    var confirmed = false;
    if (!Array.isArray(args)) {
      args = [args];
    }
    if (this.subscribed(key)) {
      this.events[key].forEach((subscriber, i) => {
        if (subscriber.callback.apply(this, args)) {
          confirmed = true;
        }
      });
    }
    return confirmed;
  }
  _notifySubscriptionChange(key, subscribed) {
    var notifiers = this.subscriptionNotifiers[key];
    if (notifiers) {
      notifiers.forEach((callback) => {
        callback(subscribed);
      });
    }
  }
  _dispatch() {
    var args = Array.from(arguments), key = args.shift();
    if (this.events[key]) {
      this.events[key].forEach((subscriber) => {
        subscriber.callback.apply(this, args);
      });
    }
  }
  _debugDispatch() {
    var args = Array.from(arguments), key = args[0];
    args[0] = "InternalEvent:" + key;
    if (this.debug === true || this.debug.includes(key)) {
      console.log(...args);
    }
    return this._dispatch(...arguments);
  }
  _debugChain() {
    var args = Array.from(arguments), key = args[0];
    args[0] = "InternalEvent:" + key;
    if (this.debug === true || this.debug.includes(key)) {
      console.log(...args);
    }
    return this._chain(...arguments);
  }
  _debugConfirm() {
    var args = Array.from(arguments), key = args[0];
    args[0] = "InternalEvent:" + key;
    if (this.debug === true || this.debug.includes(key)) {
      console.log(...args);
    }
    return this._confirm(...arguments);
  }
}
class DeprecationAdvisor extends CoreFeature {
  constructor(table) {
    super(table);
  }
  _warnUser() {
    if (this.options("debugDeprecation")) {
      console.warn(...arguments);
    }
  }
  check(oldOption, newOption, convert) {
    var msg = "";
    if (typeof this.options(oldOption) !== "undefined") {
      msg = "Deprecated Setup Option - Use of the %c" + oldOption + "%c option is now deprecated";
      if (newOption) {
        msg = msg + ", Please use the %c" + newOption + "%c option instead";
        this._warnUser(msg, "font-weight: bold;", "font-weight: normal;", "font-weight: bold;", "font-weight: normal;");
        if (convert) {
          this.table.options[newOption] = this.table.options[oldOption];
        }
      } else {
        this._warnUser(msg, "font-weight: bold;", "font-weight: normal;");
      }
      return false;
    } else {
      return true;
    }
  }
  checkMsg(oldOption, msg) {
    if (typeof this.options(oldOption) !== "undefined") {
      this._warnUser("%cDeprecated Setup Option - Use of the %c" + oldOption + " %c option is now deprecated, " + msg, "font-weight: normal;", "font-weight: bold;", "font-weight: normal;");
      return false;
    } else {
      return true;
    }
  }
  msg(msg) {
    this._warnUser(msg);
  }
}
class DependencyRegistry extends CoreFeature {
  constructor(table) {
    super(table);
    this.deps = {};
    this.props = {};
  }
  initialize() {
    this.deps = Object.assign({}, this.options("dependencies"));
  }
  lookup(key, prop, silent) {
    if (Array.isArray(key)) {
      for (const item of key) {
        var match2 = this.lookup(item, prop, true);
        if (match2) {
          break;
        }
      }
      if (match2) {
        return match2;
      } else {
        this.error(key);
      }
    } else {
      if (prop) {
        return this.lookupProp(key, prop, silent);
      } else {
        return this.lookupKey(key, silent);
      }
    }
  }
  lookupProp(key, prop, silent) {
    var dependency;
    if (this.props[key] && this.props[key][prop]) {
      return this.props[key][prop];
    } else {
      dependency = this.lookupKey(key, silent);
      if (dependency) {
        if (!this.props[key]) {
          this.props[key] = {};
        }
        this.props[key][prop] = dependency[prop] || dependency;
        return this.props[key][prop];
      }
    }
  }
  lookupKey(key, silent) {
    var dependency;
    if (this.deps[key]) {
      dependency = this.deps[key];
    } else if (window[key]) {
      this.deps[key] = window[key];
      dependency = this.deps[key];
    } else {
      if (!silent) {
        this.error(key);
      }
    }
    return dependency;
  }
  error(key) {
    console.error("Unable to find dependency", key, "Please check documentation and ensure you have imported the required library into your project");
  }
}
function fitData(columns, forced) {
  if (forced) {
    this.table.columnManager.renderer.reinitializeColumnWidths(columns);
  }
  if (this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", true)) {
    this.table.modules.responsiveLayout.update();
  }
}
function fitDataGeneral(columns, forced) {
  columns.forEach(function(column) {
    column.reinitializeWidth();
  });
  if (this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", true)) {
    this.table.modules.responsiveLayout.update();
  }
}
function fitDataStretch(columns, forced) {
  var colsWidth = 0, tableWidth = this.table.rowManager.element.clientWidth, gap = 0, lastCol = false;
  columns.forEach((column, i) => {
    if (!column.widthFixed) {
      column.reinitializeWidth();
    }
    if (this.table.options.responsiveLayout ? column.modules.responsive.visible : column.visible) {
      lastCol = column;
    }
    if (column.visible) {
      colsWidth += column.getWidth();
    }
  });
  if (lastCol) {
    gap = tableWidth - colsWidth + lastCol.getWidth();
    if (this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", true)) {
      lastCol.setWidth(0);
      this.table.modules.responsiveLayout.update();
    }
    if (gap > 0) {
      lastCol.setWidth(gap);
    } else {
      lastCol.reinitializeWidth();
    }
  } else {
    if (this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", true)) {
      this.table.modules.responsiveLayout.update();
    }
  }
}
function fitColumns(columns, forced) {
  var totalWidth = this.table.rowManager.element.getBoundingClientRect().width;
  var fixedWidth = 0;
  var flexWidth = 0;
  var flexGrowUnits = 0;
  var flexColWidth = 0;
  var flexColumns = [];
  var fixedShrinkColumns = [];
  var flexShrinkUnits = 0;
  var overflowWidth = 0;
  var gapFill = 0;
  function calcWidth(width) {
    var colWidth;
    if (typeof width == "string") {
      if (width.indexOf("%") > -1) {
        colWidth = totalWidth / 100 * parseInt(width);
      } else {
        colWidth = parseInt(width);
      }
    } else {
      colWidth = width;
    }
    return colWidth;
  }
  function scaleColumns(columns2, freeSpace, colWidth, shrinkCols) {
    var oversizeCols = [], oversizeSpace = 0, remainingSpace = 0, nextColWidth = 0, remainingFlexGrowUnits = flexGrowUnits, gap = 0, changeUnits = 0, undersizeCols = [];
    function calcGrow(col) {
      return colWidth * (col.column.definition.widthGrow || 1);
    }
    function calcShrink(col) {
      return calcWidth(col.width) - colWidth * (col.column.definition.widthShrink || 0);
    }
    columns2.forEach(function(col, i) {
      var width = shrinkCols ? calcShrink(col) : calcGrow(col);
      if (col.column.minWidth >= width) {
        oversizeCols.push(col);
      } else {
        if (col.column.maxWidth && col.column.maxWidth < width) {
          col.width = col.column.maxWidth;
          freeSpace -= col.column.maxWidth;
          remainingFlexGrowUnits -= shrinkCols ? col.column.definition.widthShrink || 1 : col.column.definition.widthGrow || 1;
          if (remainingFlexGrowUnits) {
            colWidth = Math.floor(freeSpace / remainingFlexGrowUnits);
          }
        } else {
          undersizeCols.push(col);
          changeUnits += shrinkCols ? col.column.definition.widthShrink || 1 : col.column.definition.widthGrow || 1;
        }
      }
    });
    if (oversizeCols.length) {
      oversizeCols.forEach(function(col) {
        oversizeSpace += shrinkCols ? col.width - col.column.minWidth : col.column.minWidth;
        col.width = col.column.minWidth;
      });
      remainingSpace = freeSpace - oversizeSpace;
      nextColWidth = changeUnits ? Math.floor(remainingSpace / changeUnits) : remainingSpace;
      gap = scaleColumns(undersizeCols, remainingSpace, nextColWidth, shrinkCols);
    } else {
      gap = changeUnits ? freeSpace - Math.floor(freeSpace / changeUnits) * changeUnits : freeSpace;
      undersizeCols.forEach(function(column) {
        column.width = shrinkCols ? calcShrink(column) : calcGrow(column);
      });
    }
    return gap;
  }
  if (this.table.options.responsiveLayout && this.table.modExists("responsiveLayout", true)) {
    this.table.modules.responsiveLayout.update();
  }
  if (this.table.rowManager.element.scrollHeight > this.table.rowManager.element.clientHeight) {
    totalWidth -= this.table.rowManager.element.offsetWidth - this.table.rowManager.element.clientWidth;
  }
  columns.forEach(function(column) {
    var width, minWidth, colWidth;
    if (column.visible) {
      width = column.definition.width;
      minWidth = parseInt(column.minWidth);
      if (width) {
        colWidth = calcWidth(width);
        fixedWidth += colWidth > minWidth ? colWidth : minWidth;
        if (column.definition.widthShrink) {
          fixedShrinkColumns.push({
            column,
            width: colWidth > minWidth ? colWidth : minWidth
          });
          flexShrinkUnits += column.definition.widthShrink;
        }
      } else {
        flexColumns.push({
          column,
          width: 0
        });
        flexGrowUnits += column.definition.widthGrow || 1;
      }
    }
  });
  flexWidth = totalWidth - fixedWidth;
  flexColWidth = Math.floor(flexWidth / flexGrowUnits);
  gapFill = scaleColumns(flexColumns, flexWidth, flexColWidth, false);
  if (flexColumns.length && gapFill > 0) {
    flexColumns[flexColumns.length - 1].width += gapFill;
  }
  flexColumns.forEach(function(col) {
    flexWidth -= col.width;
  });
  overflowWidth = Math.abs(gapFill) + flexWidth;
  if (overflowWidth > 0 && flexShrinkUnits) {
    gapFill = scaleColumns(fixedShrinkColumns, overflowWidth, Math.floor(overflowWidth / flexShrinkUnits), true);
  }
  if (gapFill && fixedShrinkColumns.length) {
    fixedShrinkColumns[fixedShrinkColumns.length - 1].width -= gapFill;
  }
  flexColumns.forEach(function(col) {
    col.column.setWidth(col.width);
  });
  fixedShrinkColumns.forEach(function(col) {
    col.column.setWidth(col.width);
  });
}
var defaultModes = {
  fitData,
  fitDataFill: fitDataGeneral,
  fitDataTable: fitDataGeneral,
  fitDataStretch,
  fitColumns
};
class Layout extends Module {
  static moduleName = "layout";
  //load defaults
  static modes = defaultModes;
  constructor(table) {
    super(table, "layout");
    this.mode = null;
    this.registerTableOption("layout", "fitData");
    this.registerTableOption("layoutColumnsOnNewData", false);
    this.registerColumnOption("widthGrow");
    this.registerColumnOption("widthShrink");
  }
  //initialize layout system
  initialize() {
    var layout = this.table.options.layout;
    if (Layout.modes[layout]) {
      this.mode = layout;
    } else {
      console.warn("Layout Error - invalid mode set, defaulting to 'fitData' : " + layout);
      this.mode = "fitData";
    }
    this.table.element.setAttribute("tabulator-layout", this.mode);
    this.subscribe("column-init", this.initializeColumn.bind(this));
  }
  initializeColumn(column) {
    if (column.definition.widthGrow) {
      column.definition.widthGrow = Number(column.definition.widthGrow);
    }
    if (column.definition.widthShrink) {
      column.definition.widthShrink = Number(column.definition.widthShrink);
    }
  }
  getMode() {
    return this.mode;
  }
  //trigger table layout
  layout(dataChanged) {
    var variableHeight = this.table.columnManager.columnsByIndex.find((column) => column.definition.variableHeight || column.definition.formatter === "textarea");
    this.dispatch("layout-refreshing");
    Layout.modes[this.mode].call(this, this.table.columnManager.columnsByIndex, dataChanged);
    if (variableHeight) {
      this.table.rowManager.normalizeHeight(true);
    }
    this.dispatch("layout-refreshed");
  }
}
var defaultLangs = {
  "default": {
    //hold default locale text
    "groups": {
      "item": "item",
      "items": "items"
    },
    "columns": {},
    "data": {
      "loading": "Loading",
      "error": "Error"
    },
    "pagination": {
      "page_size": "Page Size",
      "page_title": "Show Page",
      "first": "First",
      "first_title": "First Page",
      "last": "Last",
      "last_title": "Last Page",
      "prev": "Prev",
      "prev_title": "Prev Page",
      "next": "Next",
      "next_title": "Next Page",
      "all": "All",
      "counter": {
        "showing": "Showing",
        "of": "of",
        "rows": "rows",
        "pages": "pages"
      }
    },
    "headerFilters": {
      "default": "filter column...",
      "columns": {}
    }
  }
};
class Localize extends Module {
  static moduleName = "localize";
  //load defaults
  static langs = defaultLangs;
  constructor(table) {
    super(table);
    this.locale = "default";
    this.lang = false;
    this.bindings = {};
    this.langList = {};
    this.registerTableOption("locale", false);
    this.registerTableOption("langs", {});
  }
  initialize() {
    this.langList = Helpers.deepClone(Localize.langs);
    if (this.table.options.columnDefaults.headerFilterPlaceholder !== false) {
      this.setHeaderFilterPlaceholder(this.table.options.columnDefaults.headerFilterPlaceholder);
    }
    for (let locale in this.table.options.langs) {
      this.installLang(locale, this.table.options.langs[locale]);
    }
    this.setLocale(this.table.options.locale);
    this.registerTableFunction("setLocale", this.setLocale.bind(this));
    this.registerTableFunction("getLocale", this.getLocale.bind(this));
    this.registerTableFunction("getLang", this.getLang.bind(this));
  }
  //set header placeholder
  setHeaderFilterPlaceholder(placeholder) {
    this.langList.default.headerFilters.default = placeholder;
  }
  //setup a lang description object
  installLang(locale, lang) {
    if (this.langList[locale]) {
      this._setLangProp(this.langList[locale], lang);
    } else {
      this.langList[locale] = lang;
    }
  }
  _setLangProp(lang, values) {
    for (let key in values) {
      if (lang[key] && typeof lang[key] == "object") {
        this._setLangProp(lang[key], values[key]);
      } else {
        lang[key] = values[key];
      }
    }
  }
  //set current locale
  setLocale(desiredLocale) {
    desiredLocale = desiredLocale || "default";
    function traverseLang(trans, path) {
      for (var prop in trans) {
        if (typeof trans[prop] == "object") {
          if (!path[prop]) {
            path[prop] = {};
          }
          traverseLang(trans[prop], path[prop]);
        } else {
          path[prop] = trans[prop];
        }
      }
    }
    if (desiredLocale === true && navigator.language) {
      desiredLocale = navigator.language.toLowerCase();
    }
    if (desiredLocale) {
      if (!this.langList[desiredLocale]) {
        let prefix = desiredLocale.split("-")[0];
        if (this.langList[prefix]) {
          console.warn("Localization Error - Exact matching locale not found, using closest match: ", desiredLocale, prefix);
          desiredLocale = prefix;
        } else {
          console.warn("Localization Error - Matching locale not found, using default: ", desiredLocale);
          desiredLocale = "default";
        }
      }
    }
    this.locale = desiredLocale;
    this.lang = Helpers.deepClone(this.langList.default || {});
    if (desiredLocale != "default") {
      traverseLang(this.langList[desiredLocale], this.lang);
    }
    this.dispatchExternal("localized", this.locale, this.lang);
    this._executeBindings();
  }
  //get current locale
  getLocale(locale) {
    return this.locale;
  }
  //get lang object for given local or current if none provided
  getLang(locale) {
    return locale ? this.langList[locale] : this.lang;
  }
  //get text for current locale
  getText(path, value) {
    var fillPath = value ? path + "|" + value : path, pathArray = fillPath.split("|"), text = this._getLangElement(pathArray, this.locale);
    return text || "";
  }
  //traverse langs object and find localized copy
  _getLangElement(path, locale) {
    var root = this.lang;
    path.forEach(function(level) {
      var rootPath;
      if (root) {
        rootPath = root[level];
        if (typeof rootPath != "undefined") {
          root = rootPath;
        } else {
          root = false;
        }
      }
    });
    return root;
  }
  //set update binding
  bind(path, callback) {
    if (!this.bindings[path]) {
      this.bindings[path] = [];
    }
    this.bindings[path].push(callback);
    callback(this.getText(path), this.lang);
  }
  //iterate through bindings and trigger updates
  _executeBindings() {
    for (let path in this.bindings) {
      this.bindings[path].forEach((binding) => {
        binding(this.getText(path), this.lang);
      });
    }
  }
}
class Comms extends Module {
  static moduleName = "comms";
  constructor(table) {
    super(table);
  }
  initialize() {
    this.registerTableFunction("tableComms", this.receive.bind(this));
  }
  getConnections(selectors) {
    var connections = [], connection;
    connection = this.table.constructor.registry.lookupTable(selectors);
    connection.forEach((con) => {
      if (this.table !== con) {
        connections.push(con);
      }
    });
    return connections;
  }
  send(selectors, module, action, data) {
    var connections = this.getConnections(selectors);
    connections.forEach((connection) => {
      connection.tableComms(this.table.element, module, action, data);
    });
    if (!connections.length && selectors) {
      console.warn("Table Connection Error - No tables matching selector found", selectors);
    }
  }
  receive(table, module, action, data) {
    if (this.table.modExists(module)) {
      return this.table.modules[module].commsReceived(table, action, data);
    } else {
      console.warn("Inter-table Comms Error - no such module:", module);
    }
  }
}
var coreModules = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  CommsModule: Comms,
  LayoutModule: Layout,
  LocalizeModule: Localize
});
class TableRegistry {
  static registry = {
    tables: [],
    register(table) {
      TableRegistry.registry.tables.push(table);
    },
    deregister(table) {
      var index = TableRegistry.registry.tables.indexOf(table);
      if (index > -1) {
        TableRegistry.registry.tables.splice(index, 1);
      }
    },
    lookupTable(query, silent) {
      var results = [], matches, match2;
      if (typeof query === "string") {
        matches = document.querySelectorAll(query);
        if (matches.length) {
          for (var i = 0; i < matches.length; i++) {
            match2 = TableRegistry.registry.matchElement(matches[i]);
            if (match2) {
              results.push(match2);
            }
          }
        }
      } else if (typeof HTMLElement !== "undefined" && query instanceof HTMLElement || query instanceof TableRegistry) {
        match2 = TableRegistry.registry.matchElement(query);
        if (match2) {
          results.push(match2);
        }
      } else if (Array.isArray(query)) {
        query.forEach(function(item) {
          results = results.concat(TableRegistry.registry.lookupTable(item));
        });
      } else {
        if (!silent) {
          console.warn("Table Connection Error - Invalid Selector", query);
        }
      }
      return results;
    },
    matchElement(element) {
      return TableRegistry.registry.tables.find(function(table) {
        return element instanceof TableRegistry ? table === element : table.element === element;
      });
    }
  };
  static findTable(query) {
    var results = TableRegistry.registry.lookupTable(query, true);
    return Array.isArray(results) && !results.length ? false : results;
  }
}
class ModuleBinder extends TableRegistry {
  static moduleBindings = {};
  static moduleExtensions = {};
  static modulesRegistered = false;
  static defaultModules = false;
  constructor() {
    super();
  }
  static initializeModuleBinder(defaultModules) {
    if (!ModuleBinder.modulesRegistered) {
      ModuleBinder.modulesRegistered = true;
      ModuleBinder._registerModules(coreModules, true);
      if (defaultModules) {
        ModuleBinder._registerModules(defaultModules);
      }
    }
  }
  static _extendModule(name, property, values) {
    if (ModuleBinder.moduleBindings[name]) {
      var source = ModuleBinder.moduleBindings[name][property];
      if (source) {
        if (typeof values == "object") {
          for (let key in values) {
            source[key] = values[key];
          }
        } else {
          console.warn("Module Error - Invalid value type, it must be an object");
        }
      } else {
        console.warn("Module Error - property does not exist:", property);
      }
    } else {
      console.warn("Module Error - module does not exist:", name);
    }
  }
  static _registerModules(modules, core) {
    var mods = Object.values(modules);
    if (core) {
      mods.forEach((mod) => {
        mod.prototype.moduleCore = true;
      });
    }
    ModuleBinder._registerModule(mods);
  }
  static _registerModule(modules) {
    if (!Array.isArray(modules)) {
      modules = [modules];
    }
    modules.forEach((mod) => {
      ModuleBinder._registerModuleBinding(mod);
      ModuleBinder._registerModuleExtensions(mod);
    });
  }
  static _registerModuleBinding(mod) {
    if (mod.moduleName) {
      ModuleBinder.moduleBindings[mod.moduleName] = mod;
    } else {
      console.error("Unable to bind module, no moduleName defined", mod.moduleName);
    }
  }
  static _registerModuleExtensions(mod) {
    var extensions = mod.moduleExtensions;
    if (mod.moduleExtensions) {
      for (let modKey in extensions) {
        let ext = extensions[modKey];
        if (ModuleBinder.moduleBindings[modKey]) {
          for (let propKey in ext) {
            ModuleBinder._extendModule(modKey, propKey, ext[propKey]);
          }
        } else {
          if (!ModuleBinder.moduleExtensions[modKey]) {
            ModuleBinder.moduleExtensions[modKey] = {};
          }
          for (let propKey in ext) {
            if (!ModuleBinder.moduleExtensions[modKey][propKey]) {
              ModuleBinder.moduleExtensions[modKey][propKey] = {};
            }
            Object.assign(ModuleBinder.moduleExtensions[modKey][propKey], ext[propKey]);
          }
        }
      }
    }
    ModuleBinder._extendModuleFromQueue(mod);
  }
  static _extendModuleFromQueue(mod) {
    var extensions = ModuleBinder.moduleExtensions[mod.moduleName];
    if (extensions) {
      for (let propKey in extensions) {
        ModuleBinder._extendModule(mod.moduleName, propKey, extensions[propKey]);
      }
    }
  }
  //ensure that module are bound to instantiated function
  _bindModules() {
    var orderedStartMods = [], orderedEndMods = [], unOrderedMods = [];
    this.modules = {};
    for (var name in ModuleBinder.moduleBindings) {
      let mod = ModuleBinder.moduleBindings[name];
      let module = new mod(this);
      this.modules[name] = module;
      if (mod.prototype.moduleCore) {
        this.modulesCore.push(module);
      } else {
        if (mod.moduleInitOrder) {
          if (mod.moduleInitOrder < 0) {
            orderedStartMods.push(module);
          } else {
            orderedEndMods.push(module);
          }
        } else {
          unOrderedMods.push(module);
        }
      }
    }
    orderedStartMods.sort((a, b) => a.moduleInitOrder > b.moduleInitOrder ? 1 : -1);
    orderedEndMods.sort((a, b) => a.moduleInitOrder > b.moduleInitOrder ? 1 : -1);
    this.modulesRegular = orderedStartMods.concat(unOrderedMods.concat(orderedEndMods));
  }
}
class Alert extends CoreFeature {
  constructor(table) {
    super(table);
    this.element = this._createAlertElement();
    this.msgElement = this._createMsgElement();
    this.type = null;
    this.element.appendChild(this.msgElement);
  }
  _createAlertElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-alert");
    return el;
  }
  _createMsgElement() {
    var el = document.createElement("div");
    el.classList.add("tabulator-alert-msg");
    el.setAttribute("role", "alert");
    return el;
  }
  _typeClass() {
    return "tabulator-alert-state-" + this.type;
  }
  alert(content, type = "msg") {
    if (content) {
      this.clear();
      this.dispatch("alert-show", type);
      this.type = type;
      while (this.msgElement.firstChild) this.msgElement.removeChild(this.msgElement.firstChild);
      this.msgElement.classList.add(this._typeClass());
      if (typeof content === "function") {
        content = content();
      }
      if (content instanceof HTMLElement) {
        this.msgElement.appendChild(content);
      } else {
        this.msgElement.innerHTML = content;
      }
      this.table.element.appendChild(this.element);
    }
  }
  clear() {
    this.dispatch("alert-hide", this.type);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.msgElement.classList.remove(this._typeClass());
  }
}
class Tabulator extends ModuleBinder {
  //default setup options
  static defaultOptions = defaultOptions;
  static extendModule() {
    Tabulator.initializeModuleBinder();
    Tabulator._extendModule(...arguments);
  }
  static registerModule() {
    Tabulator.initializeModuleBinder();
    Tabulator._registerModule(...arguments);
  }
  constructor(element, options, modules) {
    super();
    Tabulator.initializeModuleBinder(modules);
    this.options = {};
    this.columnManager = null;
    this.rowManager = null;
    this.footerManager = null;
    this.alertManager = null;
    this.vdomHoz = null;
    this.externalEvents = null;
    this.eventBus = null;
    this.interactionMonitor = false;
    this.browser = "";
    this.browserSlow = false;
    this.browserMobile = false;
    this.rtl = false;
    this.originalElement = null;
    this.componentFunctionBinder = new ComponentFunctionBinder(this);
    this.dataLoader = false;
    this.modules = {};
    this.modulesCore = [];
    this.modulesRegular = [];
    this.deprecationAdvisor = new DeprecationAdvisor(this);
    this.optionsList = new OptionsList(this, "table constructor");
    this.dependencyRegistry = new DependencyRegistry(this);
    this.initialized = false;
    this.destroyed = false;
    if (this.initializeElement(element)) {
      this.initializeCoreSystems(options);
      setTimeout(() => {
        this._create();
      });
    }
    this.constructor.registry.register(this);
  }
  initializeElement(element) {
    if (typeof HTMLElement !== "undefined" && element instanceof HTMLElement) {
      this.element = element;
      return true;
    } else if (typeof element === "string") {
      this.element = document.querySelector(element);
      if (this.element) {
        return true;
      } else {
        console.error("Tabulator Creation Error - no element found matching selector: ", element);
        return false;
      }
    } else {
      console.error("Tabulator Creation Error - Invalid element provided:", element);
      return false;
    }
  }
  initializeCoreSystems(options) {
    this.columnManager = new ColumnManager(this);
    this.rowManager = new RowManager(this);
    this.footerManager = new FooterManager(this);
    this.dataLoader = new DataLoader(this);
    this.alertManager = new Alert(this);
    this._bindModules();
    this.options = this.optionsList.generate(Tabulator.defaultOptions, options);
    this._clearObjectPointers();
    this._mapDeprecatedFunctionality();
    this.externalEvents = new ExternalEventBus(this, this.options, this.options.debugEventsExternal);
    this.eventBus = new InternalEventBus(this.options.debugEventsInternal);
    this.interactionMonitor = new InteractionManager(this);
    this.dataLoader.initialize();
    this.footerManager.initialize();
    this.dependencyRegistry.initialize();
  }
  //convert deprecated functionality to new functions
  _mapDeprecatedFunctionality() {
  }
  _clearSelection() {
    this.element.classList.add("tabulator-block-select");
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {
      document.selection.empty();
    }
    this.element.classList.remove("tabulator-block-select");
  }
  //create table
  _create() {
    this.externalEvents.dispatch("tableBuilding");
    this.eventBus.dispatch("table-building");
    this._rtlCheck();
    this._buildElement();
    this._initializeTable();
    this.initialized = true;
    this._loadInitialData().finally(() => {
      this.eventBus.dispatch("table-initialized");
      this.externalEvents.dispatch("tableBuilt");
    });
  }
  _rtlCheck() {
    var style = window.getComputedStyle(this.element);
    switch (this.options.textDirection) {
      case "auto":
        if (style.direction !== "rtl") {
          break;
        }
      case "rtl":
        this.element.classList.add("tabulator-rtl");
        this.rtl = true;
        break;
      case "ltr":
        this.element.classList.add("tabulator-ltr");
      default:
        this.rtl = false;
    }
  }
  //clear pointers to objects in default config object
  _clearObjectPointers() {
    this.options.columns = this.options.columns.slice(0);
    if (Array.isArray(this.options.data) && !this.options.reactiveData) {
      this.options.data = this.options.data.slice(0);
    }
  }
  //build tabulator element
  _buildElement() {
    var element = this.element, options = this.options, newElement;
    if (element.tagName === "TABLE") {
      this.originalElement = this.element;
      newElement = document.createElement("div");
      var attributes = element.attributes;
      for (var i in attributes) {
        if (typeof attributes[i] == "object") {
          newElement.setAttribute(attributes[i].name, attributes[i].value);
        }
      }
      element.parentNode.replaceChild(newElement, element);
      this.element = element = newElement;
    }
    element.classList.add("tabulator");
    element.setAttribute("role", "grid");
    while (element.firstChild) element.removeChild(element.firstChild);
    if (options.height) {
      options.height = isNaN(options.height) ? options.height : options.height + "px";
      element.style.height = options.height;
    }
    if (options.minHeight !== false) {
      options.minHeight = isNaN(options.minHeight) ? options.minHeight : options.minHeight + "px";
      element.style.minHeight = options.minHeight;
    }
    if (options.maxHeight !== false) {
      options.maxHeight = isNaN(options.maxHeight) ? options.maxHeight : options.maxHeight + "px";
      element.style.maxHeight = options.maxHeight;
    }
  }
  //initialize core systems and modules
  _initializeTable() {
    var element = this.element, options = this.options;
    this.interactionMonitor.initialize();
    this.columnManager.initialize();
    this.rowManager.initialize();
    this._detectBrowser();
    this.modulesCore.forEach((mod) => {
      mod.initialize();
    });
    element.appendChild(this.columnManager.getElement());
    element.appendChild(this.rowManager.getElement());
    if (options.footerElement) {
      this.footerManager.activate();
    }
    if (options.autoColumns && options.data) {
      this.columnManager.generateColumnsFromRowData(this.options.data);
    }
    this.modulesRegular.forEach((mod) => {
      mod.initialize();
    });
    this.columnManager.setColumns(options.columns);
    this.eventBus.dispatch("table-built");
  }
  _loadInitialData() {
    return this.dataLoader.load(this.options.data).finally(() => {
      this.columnManager.verticalAlignHeaders();
    });
  }
  //deconstructor
  destroy() {
    var element = this.element;
    this.destroyed = true;
    this.constructor.registry.deregister(this);
    this.eventBus.dispatch("table-destroy");
    this.rowManager.destroy();
    while (element.firstChild) element.removeChild(element.firstChild);
    element.classList.remove("tabulator");
    this.externalEvents.dispatch("tableDestroyed");
  }
  _detectBrowser() {
    var ua = navigator.userAgent || navigator.vendor || window.opera;
    if (ua.indexOf("Trident") > -1) {
      this.browser = "ie";
      this.browserSlow = true;
    } else if (ua.indexOf("Edge") > -1) {
      this.browser = "edge";
      this.browserSlow = true;
    } else if (ua.indexOf("Firefox") > -1) {
      this.browser = "firefox";
      this.browserSlow = false;
    } else if (ua.indexOf("Mac OS") > -1) {
      this.browser = "safari";
      this.browserSlow = false;
    } else {
      this.browser = "other";
      this.browserSlow = false;
    }
    this.browserMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(ua.slice(0, 4));
  }
  initGuard(func, msg) {
    var stack, line;
    if (this.options.debugInitialization && !this.initialized) {
      if (!func) {
        stack = new Error().stack.split("\n");
        line = stack[0] == "Error" ? stack[2] : stack[1];
        if (line[0] == " ") {
          func = line.trim().split(" ")[1].split(".")[1];
        } else {
          func = line.trim().split("@")[0];
        }
      }
      console.warn("Table Not Initialized - Calling the " + func + " function before the table is initialized may result in inconsistent behavior, Please wait for the `tableBuilt` event before calling this function." + (msg ? " " + msg : ""));
    }
    return this.initialized;
  }
  ////////////////// Data Handling //////////////////
  //block table redrawing
  blockRedraw() {
    this.initGuard();
    this.eventBus.dispatch("redraw-blocking");
    this.rowManager.blockRedraw();
    this.columnManager.blockRedraw();
    this.eventBus.dispatch("redraw-blocked");
  }
  //restore table redrawing
  restoreRedraw() {
    this.initGuard();
    this.eventBus.dispatch("redraw-restoring");
    this.rowManager.restoreRedraw();
    this.columnManager.restoreRedraw();
    this.eventBus.dispatch("redraw-restored");
  }
  //load data
  setData(data, params, config) {
    this.initGuard(false, "To set initial data please use the 'data' property in the table constructor.");
    return this.dataLoader.load(data, params, config, false);
  }
  //clear data
  clearData() {
    this.initGuard();
    this.dataLoader.blockActiveLoad();
    this.rowManager.clearData();
  }
  //get table data array
  getData(active) {
    return this.rowManager.getData(active);
  }
  //get table data array count
  getDataCount(active) {
    return this.rowManager.getDataCount(active);
  }
  //replace data, keeping table in position with same sort
  replaceData(data, params, config) {
    this.initGuard();
    return this.dataLoader.load(data, params, config, true, true);
  }
  //update table data
  updateData(data) {
    var responses = 0;
    this.initGuard();
    return new Promise((resolve, reject) => {
      this.dataLoader.blockActiveLoad();
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      if (data && data.length > 0) {
        data.forEach((item) => {
          var row = this.rowManager.findRow(item[this.options.index]);
          if (row) {
            responses++;
            row.updateData(item).then(() => {
              responses--;
              if (!responses) {
                resolve();
              }
            }).catch((e) => {
              reject("Update Error - Unable to update row", item, e);
            });
          } else {
            reject("Update Error - Unable to find row", item);
          }
        });
      } else {
        console.warn("Update Error - No data provided");
        reject("Update Error - No data provided");
      }
    });
  }
  addData(data, pos, index) {
    this.initGuard();
    return new Promise((resolve, reject) => {
      this.dataLoader.blockActiveLoad();
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      if (data) {
        this.rowManager.addRows(data, pos, index).then((rows2) => {
          var output = [];
          rows2.forEach(function(row) {
            output.push(row.getComponent());
          });
          resolve(output);
        });
      } else {
        console.warn("Update Error - No data provided");
        reject("Update Error - No data provided");
      }
    });
  }
  //update table data
  updateOrAddData(data) {
    var rows2 = [], responses = 0;
    this.initGuard();
    return new Promise((resolve, reject) => {
      this.dataLoader.blockActiveLoad();
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      if (data && data.length > 0) {
        data.forEach((item) => {
          var row = this.rowManager.findRow(item[this.options.index]);
          responses++;
          if (row) {
            row.updateData(item).then(() => {
              responses--;
              rows2.push(row.getComponent());
              if (!responses) {
                resolve(rows2);
              }
            });
          } else {
            this.rowManager.addRows(item).then((newRows) => {
              responses--;
              rows2.push(newRows[0].getComponent());
              if (!responses) {
                resolve(rows2);
              }
            });
          }
        });
      } else {
        console.warn("Update Error - No data provided");
        reject("Update Error - No data provided");
      }
    });
  }
  //get row object
  getRow(index) {
    var row = this.rowManager.findRow(index);
    if (row) {
      return row.getComponent();
    } else {
      console.warn("Find Error - No matching row found:", index);
      return false;
    }
  }
  //get row object
  getRowFromPosition(position) {
    var row = this.rowManager.getRowFromPosition(position);
    if (row) {
      return row.getComponent();
    } else {
      console.warn("Find Error - No matching row found:", position);
      return false;
    }
  }
  //delete row from table
  deleteRow(index) {
    var foundRows = [];
    this.initGuard();
    if (!Array.isArray(index)) {
      index = [index];
    }
    for (let item of index) {
      let row = this.rowManager.findRow(item, true);
      if (row) {
        foundRows.push(row);
      } else {
        console.error("Delete Error - No matching row found:", item);
        return Promise.reject("Delete Error - No matching row found");
      }
    }
    foundRows.sort((a, b) => {
      return this.rowManager.rows.indexOf(a) > this.rowManager.rows.indexOf(b) ? 1 : -1;
    });
    foundRows.forEach((row) => {
      row.delete();
    });
    this.rowManager.reRenderInPosition();
    return Promise.resolve();
  }
  //add row to table
  addRow(data, pos, index) {
    this.initGuard();
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    return this.rowManager.addRows(data, pos, index, true).then((rows2) => {
      return rows2[0].getComponent();
    });
  }
  //update a row if it exists otherwise create it
  updateOrAddRow(index, data) {
    var row = this.rowManager.findRow(index);
    this.initGuard();
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    if (row) {
      return row.updateData(data).then(() => {
        return row.getComponent();
      });
    } else {
      return this.rowManager.addRows(data).then((rows2) => {
        return rows2[0].getComponent();
      });
    }
  }
  //update row data
  updateRow(index, data) {
    var row = this.rowManager.findRow(index);
    this.initGuard();
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    if (row) {
      return row.updateData(data).then(() => {
        return Promise.resolve(row.getComponent());
      });
    } else {
      console.warn("Update Error - No matching row found:", index);
      return Promise.reject("Update Error - No matching row found");
    }
  }
  //scroll to row in DOM
  scrollToRow(index, position, ifVisible) {
    var row = this.rowManager.findRow(index);
    if (row) {
      return this.rowManager.scrollToRow(row, position, ifVisible);
    } else {
      console.warn("Scroll Error - No matching row found:", index);
      return Promise.reject("Scroll Error - No matching row found");
    }
  }
  moveRow(from, to, after) {
    var fromRow = this.rowManager.findRow(from);
    this.initGuard();
    if (fromRow) {
      fromRow.moveToRow(to, after);
    } else {
      console.warn("Move Error - No matching row found:", from);
    }
  }
  getRows(active) {
    return this.rowManager.getComponents(active);
  }
  //get position of row in table
  getRowPosition(index) {
    var row = this.rowManager.findRow(index);
    if (row) {
      return row.getPosition();
    } else {
      console.warn("Position Error - No matching row found:", index);
      return false;
    }
  }
  /////////////// Column Functions  ///////////////
  setColumns(definition) {
    this.initGuard(false, "To set initial columns please use the 'columns' property in the table constructor");
    this.columnManager.setColumns(definition);
  }
  getColumns(structured) {
    return this.columnManager.getComponents(structured);
  }
  getColumn(field) {
    var column = this.columnManager.findColumn(field);
    if (column) {
      return column.getComponent();
    } else {
      console.warn("Find Error - No matching column found:", field);
      return false;
    }
  }
  getColumnDefinitions() {
    return this.columnManager.getDefinitionTree();
  }
  showColumn(field) {
    var column = this.columnManager.findColumn(field);
    this.initGuard();
    if (column) {
      column.show();
    } else {
      console.warn("Column Show Error - No matching column found:", field);
      return false;
    }
  }
  hideColumn(field) {
    var column = this.columnManager.findColumn(field);
    this.initGuard();
    if (column) {
      column.hide();
    } else {
      console.warn("Column Hide Error - No matching column found:", field);
      return false;
    }
  }
  toggleColumn(field) {
    var column = this.columnManager.findColumn(field);
    this.initGuard();
    if (column) {
      if (column.visible) {
        column.hide();
      } else {
        column.show();
      }
    } else {
      console.warn("Column Visibility Toggle Error - No matching column found:", field);
      return false;
    }
  }
  addColumn(definition, before, field) {
    var column = this.columnManager.findColumn(field);
    this.initGuard();
    return this.columnManager.addColumn(definition, before, column).then((column2) => {
      return column2.getComponent();
    });
  }
  deleteColumn(field) {
    var column = this.columnManager.findColumn(field);
    this.initGuard();
    if (column) {
      return column.delete();
    } else {
      console.warn("Column Delete Error - No matching column found:", field);
      return Promise.reject();
    }
  }
  updateColumnDefinition(field, definition) {
    var column = this.columnManager.findColumn(field);
    this.initGuard();
    if (column) {
      return column.updateDefinition(definition);
    } else {
      console.warn("Column Update Error - No matching column found:", field);
      return Promise.reject();
    }
  }
  moveColumn(from, to, after) {
    var fromColumn = this.columnManager.findColumn(from), toColumn = this.columnManager.findColumn(to);
    this.initGuard();
    if (fromColumn) {
      if (toColumn) {
        this.columnManager.moveColumn(fromColumn, toColumn, after);
      } else {
        console.warn("Move Error - No matching column found:", toColumn);
      }
    } else {
      console.warn("Move Error - No matching column found:", from);
    }
  }
  //scroll to column in DOM
  scrollToColumn(field, position, ifVisible) {
    return new Promise((resolve, reject) => {
      var column = this.columnManager.findColumn(field);
      if (column) {
        return this.columnManager.scrollToColumn(column, position, ifVisible);
      } else {
        console.warn("Scroll Error - No matching column found:", field);
        return Promise.reject("Scroll Error - No matching column found");
      }
    });
  }
  //////////// General Public Functions ////////////
  //redraw list without updating data
  redraw(force) {
    this.initGuard();
    this.columnManager.redraw(force);
    this.rowManager.redraw(force);
  }
  setHeight(height) {
    this.options.height = isNaN(height) ? height : height + "px";
    this.element.style.height = this.options.height;
    this.rowManager.initializeRenderer();
    this.rowManager.redraw(true);
  }
  //////////////////// Event Bus ///////////////////
  on(key, callback) {
    this.externalEvents.subscribe(key, callback);
  }
  off(key, callback) {
    this.externalEvents.unsubscribe(key, callback);
  }
  dispatchEvent() {
    var args = Array.from(arguments);
    args.shift();
    this.externalEvents.dispatch(...arguments);
  }
  //////////////////// Alerts ///////////////////
  alert(contents, type) {
    this.initGuard();
    this.alertManager.alert(contents, type);
  }
  clearAlert() {
    this.initGuard();
    this.alertManager.clear();
  }
  ////////////// Extension Management //////////////
  modExists(plugin, required) {
    if (this.modules[plugin]) {
      return true;
    } else {
      if (required) {
        console.error("Tabulator Module Not Installed: " + plugin);
      }
      return false;
    }
  }
  module(key) {
    var mod = this.modules[key];
    if (!mod) {
      console.error("Tabulator module not installed: " + key);
    }
    return mod;
  }
}
var Tabulator$1 = Tabulator;
class LuxonError extends Error {
}
class InvalidDateTimeError extends LuxonError {
  constructor(reason) {
    super(`Invalid DateTime: ${reason.toMessage()}`);
  }
}
class InvalidIntervalError extends LuxonError {
  constructor(reason) {
    super(`Invalid Interval: ${reason.toMessage()}`);
  }
}
class InvalidDurationError extends LuxonError {
  constructor(reason) {
    super(`Invalid Duration: ${reason.toMessage()}`);
  }
}
class ConflictingSpecificationError extends LuxonError {
}
class InvalidUnitError extends LuxonError {
  constructor(unit) {
    super(`Invalid unit ${unit}`);
  }
}
class InvalidArgumentError extends LuxonError {
}
class ZoneIsAbstractError extends LuxonError {
  constructor() {
    super("Zone is an abstract class");
  }
}
const n = "numeric", s = "short", l = "long";
const DATE_SHORT = {
  year: n,
  month: n,
  day: n
};
const DATE_MED = {
  year: n,
  month: s,
  day: n
};
const DATE_MED_WITH_WEEKDAY = {
  year: n,
  month: s,
  day: n,
  weekday: s
};
const DATE_FULL = {
  year: n,
  month: l,
  day: n
};
const DATE_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l
};
const TIME_SIMPLE = {
  hour: n,
  minute: n
};
const TIME_WITH_SECONDS = {
  hour: n,
  minute: n,
  second: n
};
const TIME_WITH_SHORT_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  timeZoneName: s
};
const TIME_WITH_LONG_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  timeZoneName: l
};
const TIME_24_SIMPLE = {
  hour: n,
  minute: n,
  hourCycle: "h23"
};
const TIME_24_WITH_SECONDS = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23"
};
const TIME_24_WITH_SHORT_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23",
  timeZoneName: s
};
const TIME_24_WITH_LONG_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23",
  timeZoneName: l
};
const DATETIME_SHORT = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: n
};
const DATETIME_SHORT_WITH_SECONDS = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: n,
  second: n
};
const DATETIME_MED = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: n
};
const DATETIME_MED_WITH_SECONDS = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: n,
  second: n
};
const DATETIME_MED_WITH_WEEKDAY = {
  year: n,
  month: s,
  day: n,
  weekday: s,
  hour: n,
  minute: n
};
const DATETIME_FULL = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: n,
  timeZoneName: s
};
const DATETIME_FULL_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: n,
  second: n,
  timeZoneName: s
};
const DATETIME_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: n,
  timeZoneName: l
};
const DATETIME_HUGE_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: n,
  second: n,
  timeZoneName: l
};
class Zone {
  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    throw new ZoneIsAbstractError();
  }
  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    throw new ZoneIsAbstractError();
  }
  /**
   * The IANA name of this zone.
   * Defaults to `name` if not overwritten by a subclass.
   * @abstract
   * @type {string}
   */
  get ianaName() {
    return this.name;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */
  get isUniversal() {
    throw new ZoneIsAbstractError();
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(ts, opts) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Returns the offset's value as a string
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    throw new ZoneIsAbstractError();
  }
}
let singleton$1 = null;
class SystemZone extends Zone {
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance() {
    if (singleton$1 === null) {
      singleton$1 = new SystemZone();
    }
    return singleton$1;
  }
  /** @override **/
  get type() {
    return "system";
  }
  /** @override **/
  get name() {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  /** @override **/
  get isUniversal() {
    return false;
  }
  /** @override **/
  offsetName(ts, { format, locale }) {
    return parseZoneInfo(ts, format, locale);
  }
  /** @override **/
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }
  /** @override **/
  offset(ts) {
    return -new Date(ts).getTimezoneOffset();
  }
  /** @override **/
  equals(otherZone) {
    return otherZone.type === "system";
  }
  /** @override **/
  get isValid() {
    return true;
  }
}
let dtfCache = {};
function makeDTF(zone) {
  if (!dtfCache[zone]) {
    dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      era: "short"
    });
  }
  return dtfCache[zone];
}
const typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  era: 3,
  hour: 4,
  minute: 5,
  second: 6
};
function hackyOffset(dtf, date2) {
  const formatted = dtf.format(date2).replace(/\u200E/g, ""), parsed = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted), [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = parsed;
  return [fYear, fMonth, fDay, fadOrBc, fHour, fMinute, fSecond];
}
function partsOffset(dtf, date2) {
  const formatted = dtf.formatToParts(date2);
  const filled = [];
  for (let i = 0; i < formatted.length; i++) {
    const { type, value } = formatted[i];
    const pos = typeToPos[type];
    if (type === "era") {
      filled[pos] = value;
    } else if (!isUndefined(pos)) {
      filled[pos] = parseInt(value, 10);
    }
  }
  return filled;
}
let ianaZoneCache = {};
class IANAZone extends Zone {
  /**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */
  static create(name) {
    if (!ianaZoneCache[name]) {
      ianaZoneCache[name] = new IANAZone(name);
    }
    return ianaZoneCache[name];
  }
  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCache() {
    ianaZoneCache = {};
    dtfCache = {};
  }
  /**
   * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
   * @param {string} s - The string to check validity on
   * @example IANAZone.isValidSpecifier("America/New_York") //=> true
   * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
   * @deprecated For backward compatibility, this forwards to isValidZone, better use `isValidZone()` directly instead.
   * @return {boolean}
   */
  static isValidSpecifier(s2) {
    return this.isValidZone(s2);
  }
  /**
   * Returns whether the provided string identifies a real zone
   * @param {string} zone - The string to check
   * @example IANAZone.isValidZone("America/New_York") //=> true
   * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
   * @example IANAZone.isValidZone("Sport~~blorp") //=> false
   * @return {boolean}
   */
  static isValidZone(zone) {
    if (!zone) {
      return false;
    }
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
      return true;
    } catch (e) {
      return false;
    }
  }
  constructor(name) {
    super();
    this.zoneName = name;
    this.valid = IANAZone.isValidZone(name);
  }
  /**
   * The type of zone. `iana` for all instances of `IANAZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "iana";
  }
  /**
   * The name of this zone (i.e. the IANA zone name).
   * @override
   * @type {string}
   */
  get name() {
    return this.zoneName;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns false for all IANA zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return false;
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(ts, { format, locale }) {
    return parseZoneInfo(ts, format, locale, this.name);
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @override
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    const date2 = new Date(ts);
    if (isNaN(date2)) return NaN;
    const dtf = makeDTF(this.name);
    let [year, month, day, adOrBc, hour, minute, second] = dtf.formatToParts ? partsOffset(dtf, date2) : hackyOffset(dtf, date2);
    if (adOrBc === "BC") {
      year = -Math.abs(year) + 1;
    }
    const adjustedHour = hour === 24 ? 0 : hour;
    const asUTC = objToLocalTS({
      year,
      month,
      day,
      hour: adjustedHour,
      minute,
      second,
      millisecond: 0
    });
    let asTS = +date2;
    const over = asTS % 1e3;
    asTS -= over >= 0 ? over : 1e3 + over;
    return (asUTC - asTS) / (60 * 1e3);
  }
  /**
   * Return whether this Zone is equal to another zone
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    return otherZone.type === "iana" && otherZone.name === this.name;
  }
  /**
   * Return whether this Zone is valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return this.valid;
  }
}
let intlLFCache = {};
function getCachedLF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlLFCache[key];
  if (!dtf) {
    dtf = new Intl.ListFormat(locString, opts);
    intlLFCache[key] = dtf;
  }
  return dtf;
}
let intlDTCache = {};
function getCachedDTF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlDTCache[key];
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(locString, opts);
    intlDTCache[key] = dtf;
  }
  return dtf;
}
let intlNumCache = {};
function getCachedINF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let inf = intlNumCache[key];
  if (!inf) {
    inf = new Intl.NumberFormat(locString, opts);
    intlNumCache[key] = inf;
  }
  return inf;
}
let intlRelCache = {};
function getCachedRTF(locString, opts = {}) {
  const { base, ...cacheKeyOpts } = opts;
  const key = JSON.stringify([locString, cacheKeyOpts]);
  let inf = intlRelCache[key];
  if (!inf) {
    inf = new Intl.RelativeTimeFormat(locString, opts);
    intlRelCache[key] = inf;
  }
  return inf;
}
let sysLocaleCache = null;
function systemLocale() {
  if (sysLocaleCache) {
    return sysLocaleCache;
  } else {
    sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
    return sysLocaleCache;
  }
}
let intlResolvedOptionsCache = {};
function getCachedIntResolvedOptions(locString) {
  if (!intlResolvedOptionsCache[locString]) {
    intlResolvedOptionsCache[locString] = new Intl.DateTimeFormat(locString).resolvedOptions();
  }
  return intlResolvedOptionsCache[locString];
}
let weekInfoCache = {};
function getCachedWeekInfo(locString) {
  let data = weekInfoCache[locString];
  if (!data) {
    const locale = new Intl.Locale(locString);
    data = "getWeekInfo" in locale ? locale.getWeekInfo() : locale.weekInfo;
    weekInfoCache[locString] = data;
  }
  return data;
}
function parseLocaleString(localeStr) {
  const xIndex = localeStr.indexOf("-x-");
  if (xIndex !== -1) {
    localeStr = localeStr.substring(0, xIndex);
  }
  const uIndex = localeStr.indexOf("-u-");
  if (uIndex === -1) {
    return [localeStr];
  } else {
    let options;
    let selectedStr;
    try {
      options = getCachedDTF(localeStr).resolvedOptions();
      selectedStr = localeStr;
    } catch (e) {
      const smaller = localeStr.substring(0, uIndex);
      options = getCachedDTF(smaller).resolvedOptions();
      selectedStr = smaller;
    }
    const { numberingSystem, calendar } = options;
    return [selectedStr, numberingSystem, calendar];
  }
}
function intlConfigString(localeStr, numberingSystem, outputCalendar) {
  if (outputCalendar || numberingSystem) {
    if (!localeStr.includes("-u-")) {
      localeStr += "-u";
    }
    if (outputCalendar) {
      localeStr += `-ca-${outputCalendar}`;
    }
    if (numberingSystem) {
      localeStr += `-nu-${numberingSystem}`;
    }
    return localeStr;
  } else {
    return localeStr;
  }
}
function mapMonths(f) {
  const ms = [];
  for (let i = 1; i <= 12; i++) {
    const dt = DateTime.utc(2009, i, 1);
    ms.push(f(dt));
  }
  return ms;
}
function mapWeekdays(f) {
  const ms = [];
  for (let i = 1; i <= 7; i++) {
    const dt = DateTime.utc(2016, 11, 13 + i);
    ms.push(f(dt));
  }
  return ms;
}
function listStuff(loc, length, englishFn, intlFn) {
  const mode = loc.listingMode();
  if (mode === "error") {
    return null;
  } else if (mode === "en") {
    return englishFn(length);
  } else {
    return intlFn(length);
  }
}
function supportsFastNumbers(loc) {
  if (loc.numberingSystem && loc.numberingSystem !== "latn") {
    return false;
  } else {
    return loc.numberingSystem === "latn" || !loc.locale || loc.locale.startsWith("en") || getCachedIntResolvedOptions(loc.locale).numberingSystem === "latn";
  }
}
class PolyNumberFormatter {
  constructor(intl, forceSimple, opts) {
    this.padTo = opts.padTo || 0;
    this.floor = opts.floor || false;
    const { padTo, floor, ...otherOpts } = opts;
    if (!forceSimple || Object.keys(otherOpts).length > 0) {
      const intlOpts = { useGrouping: false, ...opts };
      if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
      this.inf = getCachedINF(intl, intlOpts);
    }
  }
  format(i) {
    if (this.inf) {
      const fixed = this.floor ? Math.floor(i) : i;
      return this.inf.format(fixed);
    } else {
      const fixed = this.floor ? Math.floor(i) : roundTo(i, 3);
      return padStart(fixed, this.padTo);
    }
  }
}
class PolyDateFormatter {
  constructor(dt, intl, opts) {
    this.opts = opts;
    this.originalZone = void 0;
    let z = void 0;
    if (this.opts.timeZone) {
      this.dt = dt;
    } else if (dt.zone.type === "fixed") {
      const gmtOffset = -1 * (dt.offset / 60);
      const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
      if (dt.offset !== 0 && IANAZone.create(offsetZ).valid) {
        z = offsetZ;
        this.dt = dt;
      } else {
        z = "UTC";
        this.dt = dt.offset === 0 ? dt : dt.setZone("UTC").plus({ minutes: dt.offset });
        this.originalZone = dt.zone;
      }
    } else if (dt.zone.type === "system") {
      this.dt = dt;
    } else if (dt.zone.type === "iana") {
      this.dt = dt;
      z = dt.zone.name;
    } else {
      z = "UTC";
      this.dt = dt.setZone("UTC").plus({ minutes: dt.offset });
      this.originalZone = dt.zone;
    }
    const intlOpts = { ...this.opts };
    intlOpts.timeZone = intlOpts.timeZone || z;
    this.dtf = getCachedDTF(intl, intlOpts);
  }
  format() {
    if (this.originalZone) {
      return this.formatToParts().map(({ value }) => value).join("");
    }
    return this.dtf.format(this.dt.toJSDate());
  }
  formatToParts() {
    const parts = this.dtf.formatToParts(this.dt.toJSDate());
    if (this.originalZone) {
      return parts.map((part) => {
        if (part.type === "timeZoneName") {
          const offsetName = this.originalZone.offsetName(this.dt.ts, {
            locale: this.dt.locale,
            format: this.opts.timeZoneName
          });
          return {
            ...part,
            value: offsetName
          };
        } else {
          return part;
        }
      });
    }
    return parts;
  }
  resolvedOptions() {
    return this.dtf.resolvedOptions();
  }
}
class PolyRelFormatter {
  constructor(intl, isEnglish, opts) {
    this.opts = { style: "long", ...opts };
    if (!isEnglish && hasRelative()) {
      this.rtf = getCachedRTF(intl, opts);
    }
  }
  format(count, unit) {
    if (this.rtf) {
      return this.rtf.format(count, unit);
    } else {
      return formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== "long");
    }
  }
  formatToParts(count, unit) {
    if (this.rtf) {
      return this.rtf.formatToParts(count, unit);
    } else {
      return [];
    }
  }
}
const fallbackWeekSettings = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7]
};
class Locale {
  static fromOpts(opts) {
    return Locale.create(
      opts.locale,
      opts.numberingSystem,
      opts.outputCalendar,
      opts.weekSettings,
      opts.defaultToEN
    );
  }
  static create(locale, numberingSystem, outputCalendar, weekSettings, defaultToEN = false) {
    const specifiedLocale = locale || Settings.defaultLocale;
    const localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale());
    const numberingSystemR = numberingSystem || Settings.defaultNumberingSystem;
    const outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
    const weekSettingsR = validateWeekSettings(weekSettings) || Settings.defaultWeekSettings;
    return new Locale(localeR, numberingSystemR, outputCalendarR, weekSettingsR, specifiedLocale);
  }
  static resetCache() {
    sysLocaleCache = null;
    intlDTCache = {};
    intlNumCache = {};
    intlRelCache = {};
    intlResolvedOptionsCache = {};
  }
  static fromObject({ locale, numberingSystem, outputCalendar, weekSettings } = {}) {
    return Locale.create(locale, numberingSystem, outputCalendar, weekSettings);
  }
  constructor(locale, numbering, outputCalendar, weekSettings, specifiedLocale) {
    const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);
    this.locale = parsedLocale;
    this.numberingSystem = numbering || parsedNumberingSystem || null;
    this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
    this.weekSettings = weekSettings;
    this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);
    this.weekdaysCache = { format: {}, standalone: {} };
    this.monthsCache = { format: {}, standalone: {} };
    this.meridiemCache = null;
    this.eraCache = {};
    this.specifiedLocale = specifiedLocale;
    this.fastNumbersCached = null;
  }
  get fastNumbers() {
    if (this.fastNumbersCached == null) {
      this.fastNumbersCached = supportsFastNumbers(this);
    }
    return this.fastNumbersCached;
  }
  listingMode() {
    const isActuallyEn = this.isEnglish();
    const hasNoWeirdness = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
    return isActuallyEn && hasNoWeirdness ? "en" : "intl";
  }
  clone(alts) {
    if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
      return this;
    } else {
      return Locale.create(
        alts.locale || this.specifiedLocale,
        alts.numberingSystem || this.numberingSystem,
        alts.outputCalendar || this.outputCalendar,
        validateWeekSettings(alts.weekSettings) || this.weekSettings,
        alts.defaultToEN || false
      );
    }
  }
  redefaultToEN(alts = {}) {
    return this.clone({ ...alts, defaultToEN: true });
  }
  redefaultToSystem(alts = {}) {
    return this.clone({ ...alts, defaultToEN: false });
  }
  months(length, format = false) {
    return listStuff(this, length, months, () => {
      const intl = format ? { month: length, day: "numeric" } : { month: length }, formatStr = format ? "format" : "standalone";
      if (!this.monthsCache[formatStr][length]) {
        this.monthsCache[formatStr][length] = mapMonths((dt) => this.extract(dt, intl, "month"));
      }
      return this.monthsCache[formatStr][length];
    });
  }
  weekdays(length, format = false) {
    return listStuff(this, length, weekdays, () => {
      const intl = format ? { weekday: length, year: "numeric", month: "long", day: "numeric" } : { weekday: length }, formatStr = format ? "format" : "standalone";
      if (!this.weekdaysCache[formatStr][length]) {
        this.weekdaysCache[formatStr][length] = mapWeekdays(
          (dt) => this.extract(dt, intl, "weekday")
        );
      }
      return this.weekdaysCache[formatStr][length];
    });
  }
  meridiems() {
    return listStuff(
      this,
      void 0,
      () => meridiems,
      () => {
        if (!this.meridiemCache) {
          const intl = { hour: "numeric", hourCycle: "h12" };
          this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map(
            (dt) => this.extract(dt, intl, "dayperiod")
          );
        }
        return this.meridiemCache;
      }
    );
  }
  eras(length) {
    return listStuff(this, length, eras, () => {
      const intl = { era: length };
      if (!this.eraCache[length]) {
        this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map(
          (dt) => this.extract(dt, intl, "era")
        );
      }
      return this.eraCache[length];
    });
  }
  extract(dt, intlOpts, field) {
    const df = this.dtFormatter(dt, intlOpts), results = df.formatToParts(), matching = results.find((m) => m.type.toLowerCase() === field);
    return matching ? matching.value : null;
  }
  numberFormatter(opts = {}) {
    return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
  }
  dtFormatter(dt, intlOpts = {}) {
    return new PolyDateFormatter(dt, this.intl, intlOpts);
  }
  relFormatter(opts = {}) {
    return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
  }
  listFormatter(opts = {}) {
    return getCachedLF(this.intl, opts);
  }
  isEnglish() {
    return this.locale === "en" || this.locale.toLowerCase() === "en-us" || getCachedIntResolvedOptions(this.intl).locale.startsWith("en-us");
  }
  getWeekSettings() {
    if (this.weekSettings) {
      return this.weekSettings;
    } else if (!hasLocaleWeekInfo()) {
      return fallbackWeekSettings;
    } else {
      return getCachedWeekInfo(this.locale);
    }
  }
  getStartOfWeek() {
    return this.getWeekSettings().firstDay;
  }
  getMinDaysInFirstWeek() {
    return this.getWeekSettings().minimalDays;
  }
  getWeekendDays() {
    return this.getWeekSettings().weekend;
  }
  equals(other) {
    return this.locale === other.locale && this.numberingSystem === other.numberingSystem && this.outputCalendar === other.outputCalendar;
  }
  toString() {
    return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
  }
}
let singleton = null;
class FixedOffsetZone extends Zone {
  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    if (singleton === null) {
      singleton = new FixedOffsetZone(0);
    }
    return singleton;
  }
  /**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */
  static instance(offset2) {
    return offset2 === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset2);
  }
  /**
   * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
   * @param {string} s - The offset string to parse
   * @example FixedOffsetZone.parseSpecifier("UTC+6")
   * @example FixedOffsetZone.parseSpecifier("UTC+06")
   * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
   * @return {FixedOffsetZone}
   */
  static parseSpecifier(s2) {
    if (s2) {
      const r = s2.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
      if (r) {
        return new FixedOffsetZone(signedOffset(r[1], r[2]));
      }
    }
    return null;
  }
  constructor(offset2) {
    super();
    this.fixed = offset2;
  }
  /**
   * The type of zone. `fixed` for all instances of `FixedOffsetZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "fixed";
  }
  /**
   * The name of this zone.
   * All fixed zones' names always start with "UTC" (plus optional offset)
   * @override
   * @type {string}
   */
  get name() {
    return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
  }
  /**
   * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
   *
   * @override
   * @type {string}
   */
  get ianaName() {
    if (this.fixed === 0) {
      return "Etc/UTC";
    } else {
      return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
    }
  }
  /**
   * Returns the offset's common name at the specified timestamp.
   *
   * For fixed offset zones this equals to the zone name.
   * @override
   */
  offsetName() {
    return this.name;
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    return formatOffset(this.fixed, format);
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns true for all fixed offset zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return true;
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   *
   * For fixed offset zones, this is constant and does not depend on a timestamp.
   * @override
   * @return {number}
   */
  offset() {
    return this.fixed;
  }
  /**
   * Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    return otherZone.type === "fixed" && otherZone.fixed === this.fixed;
  }
  /**
   * Return whether this Zone is valid:
   * All fixed offset zones are valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return true;
  }
}
class InvalidZone extends Zone {
  constructor(zoneName) {
    super();
    this.zoneName = zoneName;
  }
  /** @override **/
  get type() {
    return "invalid";
  }
  /** @override **/
  get name() {
    return this.zoneName;
  }
  /** @override **/
  get isUniversal() {
    return false;
  }
  /** @override **/
  offsetName() {
    return null;
  }
  /** @override **/
  formatOffset() {
    return "";
  }
  /** @override **/
  offset() {
    return NaN;
  }
  /** @override **/
  equals() {
    return false;
  }
  /** @override **/
  get isValid() {
    return false;
  }
}
function normalizeZone(input, defaultZone2) {
  if (isUndefined(input) || input === null) {
    return defaultZone2;
  } else if (input instanceof Zone) {
    return input;
  } else if (isString(input)) {
    const lowered = input.toLowerCase();
    if (lowered === "default") return defaultZone2;
    else if (lowered === "local" || lowered === "system") return SystemZone.instance;
    else if (lowered === "utc" || lowered === "gmt") return FixedOffsetZone.utcInstance;
    else return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
  } else if (isNumber(input)) {
    return FixedOffsetZone.instance(input);
  } else if (typeof input === "object" && "offset" in input && typeof input.offset === "function") {
    return input;
  } else {
    return new InvalidZone(input);
  }
}
const numberingSystems = {
  arab: "[٠-٩]",
  arabext: "[۰-۹]",
  bali: "[᭐-᭙]",
  beng: "[০-৯]",
  deva: "[०-९]",
  fullwide: "[０-９]",
  gujr: "[૦-૯]",
  hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
  khmr: "[០-៩]",
  knda: "[೦-೯]",
  laoo: "[໐-໙]",
  limb: "[᥆-᥏]",
  mlym: "[൦-൯]",
  mong: "[᠐-᠙]",
  mymr: "[၀-၉]",
  orya: "[୦-୯]",
  tamldec: "[௦-௯]",
  telu: "[౦-౯]",
  thai: "[๐-๙]",
  tibt: "[༠-༩]",
  latn: "\\d"
};
const numberingSystemsUTF16 = {
  arab: [1632, 1641],
  arabext: [1776, 1785],
  bali: [6992, 7001],
  beng: [2534, 2543],
  deva: [2406, 2415],
  fullwide: [65296, 65303],
  gujr: [2790, 2799],
  khmr: [6112, 6121],
  knda: [3302, 3311],
  laoo: [3792, 3801],
  limb: [6470, 6479],
  mlym: [3430, 3439],
  mong: [6160, 6169],
  mymr: [4160, 4169],
  orya: [2918, 2927],
  tamldec: [3046, 3055],
  telu: [3174, 3183],
  thai: [3664, 3673],
  tibt: [3872, 3881]
};
const hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");
function parseDigits(str) {
  let value = parseInt(str, 10);
  if (isNaN(value)) {
    value = "";
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (str[i].search(numberingSystems.hanidec) !== -1) {
        value += hanidecChars.indexOf(str[i]);
      } else {
        for (const key in numberingSystemsUTF16) {
          const [min, max] = numberingSystemsUTF16[key];
          if (code >= min && code <= max) {
            value += code - min;
          }
        }
      }
    }
    return parseInt(value, 10);
  } else {
    return value;
  }
}
let digitRegexCache = {};
function resetDigitRegexCache() {
  digitRegexCache = {};
}
function digitRegex({ numberingSystem }, append = "") {
  const ns = numberingSystem || "latn";
  if (!digitRegexCache[ns]) {
    digitRegexCache[ns] = {};
  }
  if (!digitRegexCache[ns][append]) {
    digitRegexCache[ns][append] = new RegExp(`${numberingSystems[ns]}${append}`);
  }
  return digitRegexCache[ns][append];
}
let now = () => Date.now(), defaultZone = "system", defaultLocale = null, defaultNumberingSystem = null, defaultOutputCalendar = null, twoDigitCutoffYear = 60, throwOnInvalid, defaultWeekSettings = null;
class Settings {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return now;
  }
  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(n2) {
    now = n2;
  }
  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */
  static set defaultZone(zone) {
    defaultZone = zone;
  }
  /**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */
  static get defaultZone() {
    return normalizeZone(defaultZone, SystemZone.instance);
  }
  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return defaultLocale;
  }
  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(locale) {
    defaultLocale = locale;
  }
  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return defaultNumberingSystem;
  }
  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(numberingSystem) {
    defaultNumberingSystem = numberingSystem;
  }
  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return defaultOutputCalendar;
  }
  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(outputCalendar) {
    defaultOutputCalendar = outputCalendar;
  }
  /**
   * @typedef {Object} WeekSettings
   * @property {number} firstDay
   * @property {number} minimalDays
   * @property {number[]} weekend
   */
  /**
   * @return {WeekSettings|null}
   */
  static get defaultWeekSettings() {
    return defaultWeekSettings;
  }
  /**
   * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
   * how many days are required in the first week of a year.
   * Does not affect existing instances.
   *
   * @param {WeekSettings|null} weekSettings
   */
  static set defaultWeekSettings(weekSettings) {
    defaultWeekSettings = validateWeekSettings(weekSettings);
  }
  /**
   * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   */
  static get twoDigitCutoffYear() {
    return twoDigitCutoffYear;
  }
  /**
   * Set the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   * @example Settings.twoDigitCutoffYear = 0 // all 'yy' are interpreted as 20th century
   * @example Settings.twoDigitCutoffYear = 99 // all 'yy' are interpreted as 21st century
   * @example Settings.twoDigitCutoffYear = 50 // '49' -> 2049; '50' -> 1950
   * @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
   * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
   */
  static set twoDigitCutoffYear(cutoffYear) {
    twoDigitCutoffYear = cutoffYear % 100;
  }
  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return throwOnInvalid;
  }
  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(t) {
    throwOnInvalid = t;
  }
  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    Locale.resetCache();
    IANAZone.resetCache();
    DateTime.resetCache();
    resetDigitRegexCache();
  }
}
class Invalid {
  constructor(reason, explanation) {
    this.reason = reason;
    this.explanation = explanation;
  }
  toMessage() {
    if (this.explanation) {
      return `${this.reason}: ${this.explanation}`;
    } else {
      return this.reason;
    }
  }
}
const nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function unitOutOfRange(unit, value) {
  return new Invalid(
    "unit out of range",
    `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`
  );
}
function dayOfWeek(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (year < 100 && year >= 0) {
    d.setUTCFullYear(d.getUTCFullYear() - 1900);
  }
  const js = d.getUTCDay();
  return js === 0 ? 7 : js;
}
function computeOrdinal(year, month, day) {
  return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}
function uncomputeOrdinal(year, ordinal) {
  const table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex((i) => i < ordinal), day = ordinal - table[month0];
  return { month: month0 + 1, day };
}
function isoWeekdayToLocal(isoWeekday, startOfWeek) {
  return (isoWeekday - startOfWeek + 7) % 7 + 1;
}
function gregorianToWeek(gregObj, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const { year, month, day } = gregObj, ordinal = computeOrdinal(year, month, day), weekday = isoWeekdayToLocal(dayOfWeek(year, month, day), startOfWeek);
  let weekNumber = Math.floor((ordinal - weekday + 14 - minDaysInFirstWeek) / 7), weekYear;
  if (weekNumber < 1) {
    weekYear = year - 1;
    weekNumber = weeksInWeekYear(weekYear, minDaysInFirstWeek, startOfWeek);
  } else if (weekNumber > weeksInWeekYear(year, minDaysInFirstWeek, startOfWeek)) {
    weekYear = year + 1;
    weekNumber = 1;
  } else {
    weekYear = year;
  }
  return { weekYear, weekNumber, weekday, ...timeObject(gregObj) };
}
function weekToGregorian(weekData, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const { weekYear, weekNumber, weekday } = weekData, weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, minDaysInFirstWeek), startOfWeek), yearInDays = daysInYear(weekYear);
  let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 7 + minDaysInFirstWeek, year;
  if (ordinal < 1) {
    year = weekYear - 1;
    ordinal += daysInYear(year);
  } else if (ordinal > yearInDays) {
    year = weekYear + 1;
    ordinal -= daysInYear(weekYear);
  } else {
    year = weekYear;
  }
  const { month, day } = uncomputeOrdinal(year, ordinal);
  return { year, month, day, ...timeObject(weekData) };
}
function gregorianToOrdinal(gregData) {
  const { year, month, day } = gregData;
  const ordinal = computeOrdinal(year, month, day);
  return { year, ordinal, ...timeObject(gregData) };
}
function ordinalToGregorian(ordinalData) {
  const { year, ordinal } = ordinalData;
  const { month, day } = uncomputeOrdinal(year, ordinal);
  return { year, month, day, ...timeObject(ordinalData) };
}
function usesLocalWeekValues(obj, loc) {
  const hasLocaleWeekData = !isUndefined(obj.localWeekday) || !isUndefined(obj.localWeekNumber) || !isUndefined(obj.localWeekYear);
  if (hasLocaleWeekData) {
    const hasIsoWeekData = !isUndefined(obj.weekday) || !isUndefined(obj.weekNumber) || !isUndefined(obj.weekYear);
    if (hasIsoWeekData) {
      throw new ConflictingSpecificationError(
        "Cannot mix locale-based week fields with ISO-based week fields"
      );
    }
    if (!isUndefined(obj.localWeekday)) obj.weekday = obj.localWeekday;
    if (!isUndefined(obj.localWeekNumber)) obj.weekNumber = obj.localWeekNumber;
    if (!isUndefined(obj.localWeekYear)) obj.weekYear = obj.localWeekYear;
    delete obj.localWeekday;
    delete obj.localWeekNumber;
    delete obj.localWeekYear;
    return {
      minDaysInFirstWeek: loc.getMinDaysInFirstWeek(),
      startOfWeek: loc.getStartOfWeek()
    };
  } else {
    return { minDaysInFirstWeek: 4, startOfWeek: 1 };
  }
}
function hasInvalidWeekData(obj, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const validYear = isInteger(obj.weekYear), validWeek = integerBetween(
    obj.weekNumber,
    1,
    weeksInWeekYear(obj.weekYear, minDaysInFirstWeek, startOfWeek)
  ), validWeekday = integerBetween(obj.weekday, 1, 7);
  if (!validYear) {
    return unitOutOfRange("weekYear", obj.weekYear);
  } else if (!validWeek) {
    return unitOutOfRange("week", obj.weekNumber);
  } else if (!validWeekday) {
    return unitOutOfRange("weekday", obj.weekday);
  } else return false;
}
function hasInvalidOrdinalData(obj) {
  const validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validOrdinal) {
    return unitOutOfRange("ordinal", obj.ordinal);
  } else return false;
}
function hasInvalidGregorianData(obj) {
  const validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validMonth) {
    return unitOutOfRange("month", obj.month);
  } else if (!validDay) {
    return unitOutOfRange("day", obj.day);
  } else return false;
}
function hasInvalidTimeData(obj) {
  const { hour, minute, second, millisecond } = obj;
  const validHour = integerBetween(hour, 0, 23) || hour === 24 && minute === 0 && second === 0 && millisecond === 0, validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
  if (!validHour) {
    return unitOutOfRange("hour", hour);
  } else if (!validMinute) {
    return unitOutOfRange("minute", minute);
  } else if (!validSecond) {
    return unitOutOfRange("second", second);
  } else if (!validMillisecond) {
    return unitOutOfRange("millisecond", millisecond);
  } else return false;
}
function isUndefined(o) {
  return typeof o === "undefined";
}
function isNumber(o) {
  return typeof o === "number";
}
function isInteger(o) {
  return typeof o === "number" && o % 1 === 0;
}
function isString(o) {
  return typeof o === "string";
}
function isDate(o) {
  return Object.prototype.toString.call(o) === "[object Date]";
}
function hasRelative() {
  try {
    return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
  } catch (e) {
    return false;
  }
}
function hasLocaleWeekInfo() {
  try {
    return typeof Intl !== "undefined" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
  } catch (e) {
    return false;
  }
}
function maybeArray(thing) {
  return Array.isArray(thing) ? thing : [thing];
}
function bestBy(arr, by, compare) {
  if (arr.length === 0) {
    return void 0;
  }
  return arr.reduce((best, next) => {
    const pair = [by(next), next];
    if (!best) {
      return pair;
    } else if (compare(best[0], pair[0]) === best[0]) {
      return best;
    } else {
      return pair;
    }
  }, null)[1];
}
function pick(obj, keys) {
  return keys.reduce((a, k) => {
    a[k] = obj[k];
    return a;
  }, {});
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function validateWeekSettings(settings) {
  if (settings == null) {
    return null;
  } else if (typeof settings !== "object") {
    throw new InvalidArgumentError("Week settings must be an object");
  } else {
    if (!integerBetween(settings.firstDay, 1, 7) || !integerBetween(settings.minimalDays, 1, 7) || !Array.isArray(settings.weekend) || settings.weekend.some((v) => !integerBetween(v, 1, 7))) {
      throw new InvalidArgumentError("Invalid week settings");
    }
    return {
      firstDay: settings.firstDay,
      minimalDays: settings.minimalDays,
      weekend: Array.from(settings.weekend)
    };
  }
}
function integerBetween(thing, bottom, top) {
  return isInteger(thing) && thing >= bottom && thing <= top;
}
function floorMod(x, n2) {
  return x - n2 * Math.floor(x / n2);
}
function padStart(input, n2 = 2) {
  const isNeg = input < 0;
  let padded;
  if (isNeg) {
    padded = "-" + ("" + -input).padStart(n2, "0");
  } else {
    padded = ("" + input).padStart(n2, "0");
  }
  return padded;
}
function parseInteger(string2) {
  if (isUndefined(string2) || string2 === null || string2 === "") {
    return void 0;
  } else {
    return parseInt(string2, 10);
  }
}
function parseFloating(string2) {
  if (isUndefined(string2) || string2 === null || string2 === "") {
    return void 0;
  } else {
    return parseFloat(string2);
  }
}
function parseMillis(fraction) {
  if (isUndefined(fraction) || fraction === null || fraction === "") {
    return void 0;
  } else {
    const f = parseFloat("0." + fraction) * 1e3;
    return Math.floor(f);
  }
}
function roundTo(number2, digits, towardZero = false) {
  const factor = 10 ** digits, rounder = towardZero ? Math.trunc : Math.round;
  return rounder(number2 * factor) / factor;
}
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}
function daysInMonth(year, month) {
  const modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
  if (modMonth === 2) {
    return isLeapYear(modYear) ? 29 : 28;
  } else {
    return [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
  }
}
function objToLocalTS(obj) {
  let d = Date.UTC(
    obj.year,
    obj.month - 1,
    obj.day,
    obj.hour,
    obj.minute,
    obj.second,
    obj.millisecond
  );
  if (obj.year < 100 && obj.year >= 0) {
    d = new Date(d);
    d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
  }
  return +d;
}
function firstWeekOffset(year, minDaysInFirstWeek, startOfWeek) {
  const fwdlw = isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek);
  return -fwdlw + minDaysInFirstWeek - 1;
}
function weeksInWeekYear(weekYear, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
  const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
  return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
}
function untruncateYear(year) {
  if (year > 99) {
    return year;
  } else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2e3 + year;
}
function parseZoneInfo(ts, offsetFormat, locale, timeZone = null) {
  const date2 = new Date(ts), intlOpts = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };
  if (timeZone) {
    intlOpts.timeZone = timeZone;
  }
  const modified = { timeZoneName: offsetFormat, ...intlOpts };
  const parsed = new Intl.DateTimeFormat(locale, modified).formatToParts(date2).find((m) => m.type.toLowerCase() === "timezonename");
  return parsed ? parsed.value : null;
}
function signedOffset(offHourStr, offMinuteStr) {
  let offHour = parseInt(offHourStr, 10);
  if (Number.isNaN(offHour)) {
    offHour = 0;
  }
  const offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
  return offHour * 60 + offMinSigned;
}
function asNumber(value) {
  const numericValue = Number(value);
  if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue))
    throw new InvalidArgumentError(`Invalid unit value ${value}`);
  return numericValue;
}
function normalizeObject(obj, normalizer) {
  const normalized = {};
  for (const u in obj) {
    if (hasOwnProperty(obj, u)) {
      const v = obj[u];
      if (v === void 0 || v === null) continue;
      normalized[normalizer(u)] = asNumber(v);
    }
  }
  return normalized;
}
function formatOffset(offset2, format) {
  const hours = Math.trunc(Math.abs(offset2 / 60)), minutes = Math.trunc(Math.abs(offset2 % 60)), sign = offset2 >= 0 ? "+" : "-";
  switch (format) {
    case "short":
      return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
    case "narrow":
      return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
    case "techie":
      return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
    default:
      throw new RangeError(`Value format ${format} is out of range for property format`);
  }
}
function timeObject(obj) {
  return pick(obj, ["hour", "minute", "second", "millisecond"]);
}
const monthsLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const monthsShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
const monthsNarrow = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
function months(length) {
  switch (length) {
    case "narrow":
      return [...monthsNarrow];
    case "short":
      return [...monthsShort];
    case "long":
      return [...monthsLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    case "2-digit":
      return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    default:
      return null;
  }
}
const weekdaysLong = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekdaysNarrow = ["M", "T", "W", "T", "F", "S", "S"];
function weekdays(length) {
  switch (length) {
    case "narrow":
      return [...weekdaysNarrow];
    case "short":
      return [...weekdaysShort];
    case "long":
      return [...weekdaysLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7"];
    default:
      return null;
  }
}
const meridiems = ["AM", "PM"];
const erasLong = ["Before Christ", "Anno Domini"];
const erasShort = ["BC", "AD"];
const erasNarrow = ["B", "A"];
function eras(length) {
  switch (length) {
    case "narrow":
      return [...erasNarrow];
    case "short":
      return [...erasShort];
    case "long":
      return [...erasLong];
    default:
      return null;
  }
}
function meridiemForDateTime(dt) {
  return meridiems[dt.hour < 12 ? 0 : 1];
}
function weekdayForDateTime(dt, length) {
  return weekdays(length)[dt.weekday - 1];
}
function monthForDateTime(dt, length) {
  return months(length)[dt.month - 1];
}
function eraForDateTime(dt, length) {
  return eras(length)[dt.year < 0 ? 0 : 1];
}
function formatRelativeTime(unit, count, numeric = "always", narrow = false) {
  const units = {
    years: ["year", "yr."],
    quarters: ["quarter", "qtr."],
    months: ["month", "mo."],
    weeks: ["week", "wk."],
    days: ["day", "day", "days"],
    hours: ["hour", "hr."],
    minutes: ["minute", "min."],
    seconds: ["second", "sec."]
  };
  const lastable = ["hours", "minutes", "seconds"].indexOf(unit) === -1;
  if (numeric === "auto" && lastable) {
    const isDay = unit === "days";
    switch (count) {
      case 1:
        return isDay ? "tomorrow" : `next ${units[unit][0]}`;
      case -1:
        return isDay ? "yesterday" : `last ${units[unit][0]}`;
      case 0:
        return isDay ? "today" : `this ${units[unit][0]}`;
    }
  }
  const isInPast = Object.is(count, -0) || count < 0, fmtValue = Math.abs(count), singular = fmtValue === 1, lilUnits = units[unit], fmtUnit = narrow ? singular ? lilUnits[1] : lilUnits[2] || lilUnits[1] : singular ? units[unit][0] : unit;
  return isInPast ? `${fmtValue} ${fmtUnit} ago` : `in ${fmtValue} ${fmtUnit}`;
}
function stringifyTokens(splits, tokenToString) {
  let s2 = "";
  for (const token of splits) {
    if (token.literal) {
      s2 += token.val;
    } else {
      s2 += tokenToString(token.val);
    }
  }
  return s2;
}
const macroTokenToFormatOpts = {
  D: DATE_SHORT,
  DD: DATE_MED,
  DDD: DATE_FULL,
  DDDD: DATE_HUGE,
  t: TIME_SIMPLE,
  tt: TIME_WITH_SECONDS,
  ttt: TIME_WITH_SHORT_OFFSET,
  tttt: TIME_WITH_LONG_OFFSET,
  T: TIME_24_SIMPLE,
  TT: TIME_24_WITH_SECONDS,
  TTT: TIME_24_WITH_SHORT_OFFSET,
  TTTT: TIME_24_WITH_LONG_OFFSET,
  f: DATETIME_SHORT,
  ff: DATETIME_MED,
  fff: DATETIME_FULL,
  ffff: DATETIME_HUGE,
  F: DATETIME_SHORT_WITH_SECONDS,
  FF: DATETIME_MED_WITH_SECONDS,
  FFF: DATETIME_FULL_WITH_SECONDS,
  FFFF: DATETIME_HUGE_WITH_SECONDS
};
class Formatter {
  static create(locale, opts = {}) {
    return new Formatter(locale, opts);
  }
  static parseFormat(fmt) {
    let current = null, currentFull = "", bracketed = false;
    const splits = [];
    for (let i = 0; i < fmt.length; i++) {
      const c = fmt.charAt(i);
      if (c === "'") {
        if (currentFull.length > 0) {
          splits.push({ literal: bracketed || /^\s+$/.test(currentFull), val: currentFull });
        }
        current = null;
        currentFull = "";
        bracketed = !bracketed;
      } else if (bracketed) {
        currentFull += c;
      } else if (c === current) {
        currentFull += c;
      } else {
        if (currentFull.length > 0) {
          splits.push({ literal: /^\s+$/.test(currentFull), val: currentFull });
        }
        currentFull = c;
        current = c;
      }
    }
    if (currentFull.length > 0) {
      splits.push({ literal: bracketed || /^\s+$/.test(currentFull), val: currentFull });
    }
    return splits;
  }
  static macroTokenToFormatOpts(token) {
    return macroTokenToFormatOpts[token];
  }
  constructor(locale, formatOpts) {
    this.opts = formatOpts;
    this.loc = locale;
    this.systemLoc = null;
  }
  formatWithSystemDefault(dt, opts) {
    if (this.systemLoc === null) {
      this.systemLoc = this.loc.redefaultToSystem();
    }
    const df = this.systemLoc.dtFormatter(dt, { ...this.opts, ...opts });
    return df.format();
  }
  dtFormatter(dt, opts = {}) {
    return this.loc.dtFormatter(dt, { ...this.opts, ...opts });
  }
  formatDateTime(dt, opts) {
    return this.dtFormatter(dt, opts).format();
  }
  formatDateTimeParts(dt, opts) {
    return this.dtFormatter(dt, opts).formatToParts();
  }
  formatInterval(interval, opts) {
    const df = this.dtFormatter(interval.start, opts);
    return df.dtf.formatRange(interval.start.toJSDate(), interval.end.toJSDate());
  }
  resolvedOptions(dt, opts) {
    return this.dtFormatter(dt, opts).resolvedOptions();
  }
  num(n2, p = 0) {
    if (this.opts.forceSimple) {
      return padStart(n2, p);
    }
    const opts = { ...this.opts };
    if (p > 0) {
      opts.padTo = p;
    }
    return this.loc.numberFormatter(opts).format(n2);
  }
  formatDateTimeFromString(dt, fmt) {
    const knownEnglish = this.loc.listingMode() === "en", useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", string2 = (opts, extract) => this.loc.extract(dt, opts, extract), formatOffset2 = (opts) => {
      if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) {
        return "Z";
      }
      return dt.isValid ? dt.zone.formatOffset(dt.ts, opts.format) : "";
    }, meridiem = () => knownEnglish ? meridiemForDateTime(dt) : string2({ hour: "numeric", hourCycle: "h12" }, "dayperiod"), month = (length, standalone) => knownEnglish ? monthForDateTime(dt, length) : string2(standalone ? { month: length } : { month: length, day: "numeric" }, "month"), weekday = (length, standalone) => knownEnglish ? weekdayForDateTime(dt, length) : string2(
      standalone ? { weekday: length } : { weekday: length, month: "long", day: "numeric" },
      "weekday"
    ), maybeMacro = (token) => {
      const formatOpts = Formatter.macroTokenToFormatOpts(token);
      if (formatOpts) {
        return this.formatWithSystemDefault(dt, formatOpts);
      } else {
        return token;
      }
    }, era = (length) => knownEnglish ? eraForDateTime(dt, length) : string2({ era: length }, "era"), tokenToString = (token) => {
      switch (token) {
        // ms
        case "S":
          return this.num(dt.millisecond);
        case "u":
        // falls through
        case "SSS":
          return this.num(dt.millisecond, 3);
        // seconds
        case "s":
          return this.num(dt.second);
        case "ss":
          return this.num(dt.second, 2);
        // fractional seconds
        case "uu":
          return this.num(Math.floor(dt.millisecond / 10), 2);
        case "uuu":
          return this.num(Math.floor(dt.millisecond / 100));
        // minutes
        case "m":
          return this.num(dt.minute);
        case "mm":
          return this.num(dt.minute, 2);
        // hours
        case "h":
          return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
        case "hh":
          return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
        case "H":
          return this.num(dt.hour);
        case "HH":
          return this.num(dt.hour, 2);
        // offset
        case "Z":
          return formatOffset2({ format: "narrow", allowZ: this.opts.allowZ });
        case "ZZ":
          return formatOffset2({ format: "short", allowZ: this.opts.allowZ });
        case "ZZZ":
          return formatOffset2({ format: "techie", allowZ: this.opts.allowZ });
        case "ZZZZ":
          return dt.zone.offsetName(dt.ts, { format: "short", locale: this.loc.locale });
        case "ZZZZZ":
          return dt.zone.offsetName(dt.ts, { format: "long", locale: this.loc.locale });
        // zone
        case "z":
          return dt.zoneName;
        // meridiems
        case "a":
          return meridiem();
        // dates
        case "d":
          return useDateTimeFormatter ? string2({ day: "numeric" }, "day") : this.num(dt.day);
        case "dd":
          return useDateTimeFormatter ? string2({ day: "2-digit" }, "day") : this.num(dt.day, 2);
        // weekdays - standalone
        case "c":
          return this.num(dt.weekday);
        case "ccc":
          return weekday("short", true);
        case "cccc":
          return weekday("long", true);
        case "ccccc":
          return weekday("narrow", true);
        // weekdays - format
        case "E":
          return this.num(dt.weekday);
        case "EEE":
          return weekday("short", false);
        case "EEEE":
          return weekday("long", false);
        case "EEEEE":
          return weekday("narrow", false);
        // months - standalone
        case "L":
          return useDateTimeFormatter ? string2({ month: "numeric", day: "numeric" }, "month") : this.num(dt.month);
        case "LL":
          return useDateTimeFormatter ? string2({ month: "2-digit", day: "numeric" }, "month") : this.num(dt.month, 2);
        case "LLL":
          return month("short", true);
        case "LLLL":
          return month("long", true);
        case "LLLLL":
          return month("narrow", true);
        // months - format
        case "M":
          return useDateTimeFormatter ? string2({ month: "numeric" }, "month") : this.num(dt.month);
        case "MM":
          return useDateTimeFormatter ? string2({ month: "2-digit" }, "month") : this.num(dt.month, 2);
        case "MMM":
          return month("short", false);
        case "MMMM":
          return month("long", false);
        case "MMMMM":
          return month("narrow", false);
        // years
        case "y":
          return useDateTimeFormatter ? string2({ year: "numeric" }, "year") : this.num(dt.year);
        case "yy":
          return useDateTimeFormatter ? string2({ year: "2-digit" }, "year") : this.num(dt.year.toString().slice(-2), 2);
        case "yyyy":
          return useDateTimeFormatter ? string2({ year: "numeric" }, "year") : this.num(dt.year, 4);
        case "yyyyyy":
          return useDateTimeFormatter ? string2({ year: "numeric" }, "year") : this.num(dt.year, 6);
        // eras
        case "G":
          return era("short");
        case "GG":
          return era("long");
        case "GGGGG":
          return era("narrow");
        case "kk":
          return this.num(dt.weekYear.toString().slice(-2), 2);
        case "kkkk":
          return this.num(dt.weekYear, 4);
        case "W":
          return this.num(dt.weekNumber);
        case "WW":
          return this.num(dt.weekNumber, 2);
        case "n":
          return this.num(dt.localWeekNumber);
        case "nn":
          return this.num(dt.localWeekNumber, 2);
        case "ii":
          return this.num(dt.localWeekYear.toString().slice(-2), 2);
        case "iiii":
          return this.num(dt.localWeekYear, 4);
        case "o":
          return this.num(dt.ordinal);
        case "ooo":
          return this.num(dt.ordinal, 3);
        case "q":
          return this.num(dt.quarter);
        case "qq":
          return this.num(dt.quarter, 2);
        case "X":
          return this.num(Math.floor(dt.ts / 1e3));
        case "x":
          return this.num(dt.ts);
        default:
          return maybeMacro(token);
      }
    };
    return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
  }
  formatDurationFromString(dur, fmt) {
    const tokenToField = (token) => {
      switch (token[0]) {
        case "S":
          return "millisecond";
        case "s":
          return "second";
        case "m":
          return "minute";
        case "h":
          return "hour";
        case "d":
          return "day";
        case "w":
          return "week";
        case "M":
          return "month";
        case "y":
          return "year";
        default:
          return null;
      }
    }, tokenToString = (lildur) => (token) => {
      const mapped = tokenToField(token);
      if (mapped) {
        return this.num(lildur.get(mapped), token.length);
      } else {
        return token;
      }
    }, tokens = Formatter.parseFormat(fmt), realTokens = tokens.reduce(
      (found, { literal, val }) => literal ? found : found.concat(val),
      []
    ), collapsed = dur.shiftTo(...realTokens.map(tokenToField).filter((t) => t));
    return stringifyTokens(tokens, tokenToString(collapsed));
  }
}
const ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function combineRegexes(...regexes) {
  const full = regexes.reduce((f, r) => f + r.source, "");
  return RegExp(`^${full}$`);
}
function combineExtractors(...extractors) {
  return (m) => extractors.reduce(
    ([mergedVals, mergedZone, cursor], ex) => {
      const [val, zone, next] = ex(m, cursor);
      return [{ ...mergedVals, ...val }, zone || mergedZone, next];
    },
    [{}, null, 1]
  ).slice(0, 2);
}
function parse(s2, ...patterns) {
  if (s2 == null) {
    return [null, null];
  }
  for (const [regex, extractor] of patterns) {
    const m = regex.exec(s2);
    if (m) {
      return extractor(m);
    }
  }
  return [null, null];
}
function simpleParse(...keys) {
  return (match2, cursor) => {
    const ret = {};
    let i;
    for (i = 0; i < keys.length; i++) {
      ret[keys[i]] = parseInteger(match2[cursor + i]);
    }
    return [ret, null, cursor + i];
  };
}
const offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;
const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
const isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`);
const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
const extractISOOrdinalData = simpleParse("year", "ordinal");
const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/;
const sqlTimeRegex = RegExp(
  `${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`
);
const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
function int(match2, pos, fallback) {
  const m = match2[pos];
  return isUndefined(m) ? fallback : parseInteger(m);
}
function extractISOYmd(match2, cursor) {
  const item = {
    year: int(match2, cursor),
    month: int(match2, cursor + 1, 1),
    day: int(match2, cursor + 2, 1)
  };
  return [item, null, cursor + 3];
}
function extractISOTime(match2, cursor) {
  const item = {
    hours: int(match2, cursor, 0),
    minutes: int(match2, cursor + 1, 0),
    seconds: int(match2, cursor + 2, 0),
    milliseconds: parseMillis(match2[cursor + 3])
  };
  return [item, null, cursor + 4];
}
function extractISOOffset(match2, cursor) {
  const local = !match2[cursor] && !match2[cursor + 1], fullOffset = signedOffset(match2[cursor + 1], match2[cursor + 2]), zone = local ? null : FixedOffsetZone.instance(fullOffset);
  return [{}, zone, cursor + 3];
}
function extractIANAZone(match2, cursor) {
  const zone = match2[cursor] ? IANAZone.create(match2[cursor]) : null;
  return [{}, zone, cursor + 1];
}
const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);
const isoDuration = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function extractISODuration(match2) {
  const [s2, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] = match2;
  const hasNegativePrefix = s2[0] === "-";
  const negativeSeconds = secondStr && secondStr[0] === "-";
  const maybeNegate = (num, force = false) => num !== void 0 && (force || num && hasNegativePrefix) ? -num : num;
  return [
    {
      years: maybeNegate(parseFloating(yearStr)),
      months: maybeNegate(parseFloating(monthStr)),
      weeks: maybeNegate(parseFloating(weekStr)),
      days: maybeNegate(parseFloating(dayStr)),
      hours: maybeNegate(parseFloating(hourStr)),
      minutes: maybeNegate(parseFloating(minuteStr)),
      seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
      milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds)
    }
  ];
}
const obsOffsets = {
  GMT: 0,
  EDT: -4 * 60,
  EST: -5 * 60,
  CDT: -5 * 60,
  CST: -6 * 60,
  MDT: -6 * 60,
  MST: -7 * 60,
  PDT: -7 * 60,
  PST: -8 * 60
};
function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
  const result = {
    year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
    month: monthsShort.indexOf(monthStr) + 1,
    day: parseInteger(dayStr),
    hour: parseInteger(hourStr),
    minute: parseInteger(minuteStr)
  };
  if (secondStr) result.second = parseInteger(secondStr);
  if (weekdayStr) {
    result.weekday = weekdayStr.length > 3 ? weekdaysLong.indexOf(weekdayStr) + 1 : weekdaysShort.indexOf(weekdayStr) + 1;
  }
  return result;
}
const rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function extractRFC2822(match2) {
  const [
    ,
    weekdayStr,
    dayStr,
    monthStr,
    yearStr,
    hourStr,
    minuteStr,
    secondStr,
    obsOffset,
    milOffset,
    offHourStr,
    offMinuteStr
  ] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  let offset2;
  if (obsOffset) {
    offset2 = obsOffsets[obsOffset];
  } else if (milOffset) {
    offset2 = 0;
  } else {
    offset2 = signedOffset(offHourStr, offMinuteStr);
  }
  return [result, new FixedOffsetZone(offset2)];
}
function preprocessRFC2822(s2) {
  return s2.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
const rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, rfc850 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function extractRFC1123Or850(match2) {
  const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}
function extractASCII(match2) {
  const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}
const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);
const extractISOYmdTimeAndOffset = combineExtractors(
  extractISOYmd,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOWeekTimeAndOffset = combineExtractors(
  extractISOWeekData,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOOrdinalDateAndTime = combineExtractors(
  extractISOOrdinalData,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOTimeAndOffset = combineExtractors(
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
function parseISODate(s2) {
  return parse(
    s2,
    [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
    [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset],
    [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime],
    [isoTimeCombinedRegex, extractISOTimeAndOffset]
  );
}
function parseRFC2822Date(s2) {
  return parse(preprocessRFC2822(s2), [rfc2822, extractRFC2822]);
}
function parseHTTPDate(s2) {
  return parse(
    s2,
    [rfc1123, extractRFC1123Or850],
    [rfc850, extractRFC1123Or850],
    [ascii, extractASCII]
  );
}
function parseISODuration(s2) {
  return parse(s2, [isoDuration, extractISODuration]);
}
const extractISOTimeOnly = combineExtractors(extractISOTime);
function parseISOTimeOnly(s2) {
  return parse(s2, [isoTimeOnly, extractISOTimeOnly]);
}
const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
const extractISOTimeOffsetAndIANAZone = combineExtractors(
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
function parseSQL(s2) {
  return parse(
    s2,
    [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
    [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]
  );
}
const INVALID$2 = "Invalid Duration";
const lowOrderMatrix = {
  weeks: {
    days: 7,
    hours: 7 * 24,
    minutes: 7 * 24 * 60,
    seconds: 7 * 24 * 60 * 60,
    milliseconds: 7 * 24 * 60 * 60 * 1e3
  },
  days: {
    hours: 24,
    minutes: 24 * 60,
    seconds: 24 * 60 * 60,
    milliseconds: 24 * 60 * 60 * 1e3
  },
  hours: { minutes: 60, seconds: 60 * 60, milliseconds: 60 * 60 * 1e3 },
  minutes: { seconds: 60, milliseconds: 60 * 1e3 },
  seconds: { milliseconds: 1e3 }
}, casualMatrix = {
  years: {
    quarters: 4,
    months: 12,
    weeks: 52,
    days: 365,
    hours: 365 * 24,
    minutes: 365 * 24 * 60,
    seconds: 365 * 24 * 60 * 60,
    milliseconds: 365 * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: 13,
    days: 91,
    hours: 91 * 24,
    minutes: 91 * 24 * 60,
    seconds: 91 * 24 * 60 * 60,
    milliseconds: 91 * 24 * 60 * 60 * 1e3
  },
  months: {
    weeks: 4,
    days: 30,
    hours: 30 * 24,
    minutes: 30 * 24 * 60,
    seconds: 30 * 24 * 60 * 60,
    milliseconds: 30 * 24 * 60 * 60 * 1e3
  },
  ...lowOrderMatrix
}, daysInYearAccurate = 146097 / 400, daysInMonthAccurate = 146097 / 4800, accurateMatrix = {
  years: {
    quarters: 4,
    months: 12,
    weeks: daysInYearAccurate / 7,
    days: daysInYearAccurate,
    hours: daysInYearAccurate * 24,
    minutes: daysInYearAccurate * 24 * 60,
    seconds: daysInYearAccurate * 24 * 60 * 60,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: daysInYearAccurate / 28,
    days: daysInYearAccurate / 4,
    hours: daysInYearAccurate * 24 / 4,
    minutes: daysInYearAccurate * 24 * 60 / 4,
    seconds: daysInYearAccurate * 24 * 60 * 60 / 4,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3 / 4
  },
  months: {
    weeks: daysInMonthAccurate / 7,
    days: daysInMonthAccurate,
    hours: daysInMonthAccurate * 24,
    minutes: daysInMonthAccurate * 24 * 60,
    seconds: daysInMonthAccurate * 24 * 60 * 60,
    milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1e3
  },
  ...lowOrderMatrix
};
const orderedUnits$1 = [
  "years",
  "quarters",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds"
];
const reverseUnits = orderedUnits$1.slice(0).reverse();
function clone$1(dur, alts, clear = false) {
  const conf = {
    values: clear ? alts.values : { ...dur.values, ...alts.values || {} },
    loc: dur.loc.clone(alts.loc),
    conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
    matrix: alts.matrix || dur.matrix
  };
  return new Duration(conf);
}
function durationToMillis(matrix, vals) {
  let sum = vals.milliseconds ?? 0;
  for (const unit of reverseUnits.slice(1)) {
    if (vals[unit]) {
      sum += vals[unit] * matrix[unit]["milliseconds"];
    }
  }
  return sum;
}
function normalizeValues(matrix, vals) {
  const factor = durationToMillis(matrix, vals) < 0 ? -1 : 1;
  orderedUnits$1.reduceRight((previous, current) => {
    if (!isUndefined(vals[current])) {
      if (previous) {
        const previousVal = vals[previous] * factor;
        const conv = matrix[current][previous];
        const rollUp = Math.floor(previousVal / conv);
        vals[current] += rollUp * factor;
        vals[previous] -= rollUp * conv * factor;
      }
      return current;
    } else {
      return previous;
    }
  }, null);
  orderedUnits$1.reduce((previous, current) => {
    if (!isUndefined(vals[current])) {
      if (previous) {
        const fraction = vals[previous] % 1;
        vals[previous] -= fraction;
        vals[current] += fraction * matrix[previous][current];
      }
      return current;
    } else {
      return previous;
    }
  }, null);
}
function removeZeroes(vals) {
  const newVals = {};
  for (const [key, value] of Object.entries(vals)) {
    if (value !== 0) {
      newVals[key] = value;
    }
  }
  return newVals;
}
class Duration {
  /**
   * @private
   */
  constructor(config) {
    const accurate = config.conversionAccuracy === "longterm" || false;
    let matrix = accurate ? accurateMatrix : casualMatrix;
    if (config.matrix) {
      matrix = config.matrix;
    }
    this.values = config.values;
    this.loc = config.loc || Locale.create();
    this.conversionAccuracy = accurate ? "longterm" : "casual";
    this.invalid = config.invalid || null;
    this.matrix = matrix;
    this.isLuxonDuration = true;
  }
  /**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  static fromMillis(count, opts) {
    return Duration.fromObject({ milliseconds: count }, opts);
  }
  /**
   * Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
   * If this object is empty then a zero milliseconds duration is returned.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.years
   * @param {number} obj.quarters
   * @param {number} obj.months
   * @param {number} obj.weeks
   * @param {number} obj.days
   * @param {number} obj.hours
   * @param {number} obj.minutes
   * @param {number} obj.seconds
   * @param {number} obj.milliseconds
   * @param {Object} [opts=[]] - options for creating this Duration
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the custom conversion system to use
   * @return {Duration}
   */
  static fromObject(obj, opts = {}) {
    if (obj == null || typeof obj !== "object") {
      throw new InvalidArgumentError(
        `Duration.fromObject: argument expected to be an object, got ${obj === null ? "null" : typeof obj}`
      );
    }
    return new Duration({
      values: normalizeObject(obj, Duration.normalizeUnit),
      loc: Locale.fromObject(opts),
      conversionAccuracy: opts.conversionAccuracy,
      matrix: opts.matrix
    });
  }
  /**
   * Create a Duration from DurationLike.
   *
   * @param {Object | number | Duration} durationLike
   * One of:
   * - object with keys like 'years' and 'hours'.
   * - number representing milliseconds
   * - Duration instance
   * @return {Duration}
   */
  static fromDurationLike(durationLike) {
    if (isNumber(durationLike)) {
      return Duration.fromMillis(durationLike);
    } else if (Duration.isDuration(durationLike)) {
      return durationLike;
    } else if (typeof durationLike === "object") {
      return Duration.fromObject(durationLike);
    } else {
      throw new InvalidArgumentError(
        `Unknown duration argument ${durationLike} of type ${typeof durationLike}`
      );
    }
  }
  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the preset conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */
  static fromISO(text, opts) {
    const [parsed] = parseISODuration(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }
  /**
   * Create a Duration from an ISO 8601 time string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
   * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @return {Duration}
   */
  static fromISOTime(text, opts) {
    const [parsed] = parseISOTimeOnly(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }
  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidDurationError(invalid);
    } else {
      return new Duration({ invalid });
    }
  }
  /**
   * @private
   */
  static normalizeUnit(unit) {
    const normalized = {
      year: "years",
      years: "years",
      quarter: "quarters",
      quarters: "quarters",
      month: "months",
      months: "months",
      week: "weeks",
      weeks: "weeks",
      day: "days",
      days: "days",
      hour: "hours",
      hours: "hours",
      minute: "minutes",
      minutes: "minutes",
      second: "seconds",
      seconds: "seconds",
      millisecond: "milliseconds",
      milliseconds: "milliseconds"
    }[unit ? unit.toLowerCase() : unit];
    if (!normalized) throw new InvalidUnitError(unit);
    return normalized;
  }
  /**
   * Check if an object is a Duration. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDuration(o) {
    return o && o.isLuxonDuration || false;
  }
  /**
   * Get  the locale of a Duration, such 'en-GB'
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
   * * `S` for milliseconds
   * * `s` for seconds
   * * `m` for minutes
   * * `h` for hours
   * * `d` for days
   * * `w` for weeks
   * * `M` for months
   * * `y` for years
   * Notes:
   * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
   * * Tokens can be escaped by wrapping with single quotes.
   * * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} [opts.floor=true] - floor numerical values
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    const fmtOpts = {
      ...opts,
      floor: opts.round !== false && opts.floor !== false
    };
    return this.isValid ? Formatter.create(this.loc, fmtOpts).formatDurationFromString(this, fmt) : INVALID$2;
  }
  /**
   * Returns a string representation of a Duration with all units included.
   * To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
   * @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
   * @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
   * @example
   * ```js
   * var dur = Duration.fromObject({ days: 1, hours: 5, minutes: 6 })
   * dur.toHuman() //=> '1 day, 5 hours, 6 minutes'
   * dur.toHuman({ listStyle: "long" }) //=> '1 day, 5 hours, and 6 minutes'
   * dur.toHuman({ unitDisplay: "short" }) //=> '1 day, 5 hr, 6 min'
   * ```
   */
  toHuman(opts = {}) {
    if (!this.isValid) return INVALID$2;
    const l2 = orderedUnits$1.map((unit) => {
      const val = this.values[unit];
      if (isUndefined(val)) {
        return null;
      }
      return this.loc.numberFormatter({ style: "unit", unitDisplay: "long", ...opts, unit: unit.slice(0, -1) }).format(val);
    }).filter((n2) => n2);
    return this.loc.listFormatter({ type: "conjunction", style: opts.listStyle || "narrow", ...opts }).format(l2);
  }
  /**
   * Returns a JavaScript object with this Duration's values.
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */
  toObject() {
    if (!this.isValid) return {};
    return { ...this.values };
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
   * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
   * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
   * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
   * @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
   * @return {string}
   */
  toISO() {
    if (!this.isValid) return null;
    let s2 = "P";
    if (this.years !== 0) s2 += this.years + "Y";
    if (this.months !== 0 || this.quarters !== 0) s2 += this.months + this.quarters * 3 + "M";
    if (this.weeks !== 0) s2 += this.weeks + "W";
    if (this.days !== 0) s2 += this.days + "D";
    if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0)
      s2 += "T";
    if (this.hours !== 0) s2 += this.hours + "H";
    if (this.minutes !== 0) s2 += this.minutes + "M";
    if (this.seconds !== 0 || this.milliseconds !== 0)
      s2 += roundTo(this.seconds + this.milliseconds / 1e3, 3) + "S";
    if (s2 === "P") s2 += "T0S";
    return s2;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
   * Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
   * @return {string}
   */
  toISOTime(opts = {}) {
    if (!this.isValid) return null;
    const millis = this.toMillis();
    if (millis < 0 || millis >= 864e5) return null;
    opts = {
      suppressMilliseconds: false,
      suppressSeconds: false,
      includePrefix: false,
      format: "extended",
      ...opts,
      includeOffset: false
    };
    const dateTime = DateTime.fromMillis(millis, { zone: "UTC" });
    return dateTime.toISOTime(opts);
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */
  toString() {
    return this.toISO();
  }
  /**
   * Returns a string representation of this Duration appropriate for the REPL.
   * @return {string}
   */
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `Duration { values: ${JSON.stringify(this.values)} }`;
    } else {
      return `Duration { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns an milliseconds value of this Duration.
   * @return {number}
   */
  toMillis() {
    if (!this.isValid) return NaN;
    return durationToMillis(this.matrix, this.values);
  }
  /**
   * Returns an milliseconds value of this Duration. Alias of {@link toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  plus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration), result = {};
    for (const k of orderedUnits$1) {
      if (hasOwnProperty(dur.values, k) || hasOwnProperty(this.values, k)) {
        result[k] = dur.get(k) + this.get(k);
      }
    }
    return clone$1(this, { values: result }, true);
  }
  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  minus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration);
    return this.plus(dur.negate());
  }
  /**
   * Scale this Duration by the specified amount. Return a newly-constructed Duration.
   * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
   * @return {Duration}
   */
  mapUnits(fn) {
    if (!this.isValid) return this;
    const result = {};
    for (const k of Object.keys(this.values)) {
      result[k] = asNumber(fn(this.values[k], k));
    }
    return clone$1(this, { values: result }, true);
  }
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
   * @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
   * @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
   * @return {number}
   */
  get(unit) {
    return this[Duration.normalizeUnit(unit)];
  }
  /**
   * "Set" the values of specified units. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */
  set(values) {
    if (!this.isValid) return this;
    const mixed = { ...this.values, ...normalizeObject(values, Duration.normalizeUnit) };
    return clone$1(this, { values: mixed });
  }
  /**
   * "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */
  reconfigure({ locale, numberingSystem, conversionAccuracy, matrix } = {}) {
    const loc = this.loc.clone({ locale, numberingSystem });
    const opts = { loc, matrix, conversionAccuracy };
    return clone$1(this, opts);
  }
  /**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */
  as(unit) {
    return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
  }
  /**
   * Reduce this Duration to its canonical representation in its current units.
   * Assuming the overall value of the Duration is positive, this means:
   * - excessive values for lower-order units are converted to higher-order units (if possible, see first and second example)
   * - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
   *   the overall value would be negative, see third example)
   * - fractional values for higher-order units are converted to lower-order units (if possible, see fourth example)
   *
   * If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
   * @return {Duration}
   */
  normalize() {
    if (!this.isValid) return this;
    const vals = this.toObject();
    normalizeValues(this.matrix, vals);
    return clone$1(this, { values: vals }, true);
  }
  /**
   * Rescale units to its largest representation
   * @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
   * @return {Duration}
   */
  rescale() {
    if (!this.isValid) return this;
    const vals = removeZeroes(this.normalize().shiftToAll().toObject());
    return clone$1(this, { values: vals }, true);
  }
  /**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */
  shiftTo(...units) {
    if (!this.isValid) return this;
    if (units.length === 0) {
      return this;
    }
    units = units.map((u) => Duration.normalizeUnit(u));
    const built = {}, accumulated = {}, vals = this.toObject();
    let lastUnit;
    for (const k of orderedUnits$1) {
      if (units.indexOf(k) >= 0) {
        lastUnit = k;
        let own = 0;
        for (const ak in accumulated) {
          own += this.matrix[ak][k] * accumulated[ak];
          accumulated[ak] = 0;
        }
        if (isNumber(vals[k])) {
          own += vals[k];
        }
        const i = Math.trunc(own);
        built[k] = i;
        accumulated[k] = (own * 1e3 - i * 1e3) / 1e3;
      } else if (isNumber(vals[k])) {
        accumulated[k] = vals[k];
      }
    }
    for (const key in accumulated) {
      if (accumulated[key] !== 0) {
        built[lastUnit] += key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
      }
    }
    normalizeValues(this.matrix, built);
    return clone$1(this, { values: built }, true);
  }
  /**
   * Shift this Duration to all available units.
   * Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
   * @return {Duration}
   */
  shiftToAll() {
    if (!this.isValid) return this;
    return this.shiftTo(
      "years",
      "months",
      "weeks",
      "days",
      "hours",
      "minutes",
      "seconds",
      "milliseconds"
    );
  }
  /**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */
  negate() {
    if (!this.isValid) return this;
    const negated = {};
    for (const k of Object.keys(this.values)) {
      negated[k] = this.values[k] === 0 ? 0 : -this.values[k];
    }
    return clone$1(this, { values: negated }, true);
  }
  /**
   * Get the years.
   * @type {number}
   */
  get years() {
    return this.isValid ? this.values.years || 0 : NaN;
  }
  /**
   * Get the quarters.
   * @type {number}
   */
  get quarters() {
    return this.isValid ? this.values.quarters || 0 : NaN;
  }
  /**
   * Get the months.
   * @type {number}
   */
  get months() {
    return this.isValid ? this.values.months || 0 : NaN;
  }
  /**
   * Get the weeks
   * @type {number}
   */
  get weeks() {
    return this.isValid ? this.values.weeks || 0 : NaN;
  }
  /**
   * Get the days.
   * @type {number}
   */
  get days() {
    return this.isValid ? this.values.days || 0 : NaN;
  }
  /**
   * Get the hours.
   * @type {number}
   */
  get hours() {
    return this.isValid ? this.values.hours || 0 : NaN;
  }
  /**
   * Get the minutes.
   * @type {number}
   */
  get minutes() {
    return this.isValid ? this.values.minutes || 0 : NaN;
  }
  /**
   * Get the seconds.
   * @return {number}
   */
  get seconds() {
    return this.isValid ? this.values.seconds || 0 : NaN;
  }
  /**
   * Get the milliseconds.
   * @return {number}
   */
  get milliseconds() {
    return this.isValid ? this.values.milliseconds || 0 : NaN;
  }
  /**
   * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
   * on invalid DateTimes or Intervals.
   * @return {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this Duration became invalid, or null if the Duration is valid
   * @return {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }
    if (!this.loc.equals(other.loc)) {
      return false;
    }
    function eq(v1, v2) {
      if (v1 === void 0 || v1 === 0) return v2 === void 0 || v2 === 0;
      return v1 === v2;
    }
    for (const u of orderedUnits$1) {
      if (!eq(this.values[u], other.values[u])) {
        return false;
      }
    }
    return true;
  }
}
const INVALID$1 = "Invalid Interval";
function validateStartEnd(start, end) {
  if (!start || !start.isValid) {
    return Interval.invalid("missing or invalid start");
  } else if (!end || !end.isValid) {
    return Interval.invalid("missing or invalid end");
  } else if (end < start) {
    return Interval.invalid(
      "end before start",
      `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`
    );
  } else {
    return null;
  }
}
class Interval {
  /**
   * @private
   */
  constructor(config) {
    this.s = config.start;
    this.e = config.end;
    this.invalid = config.invalid || null;
    this.isLuxonInterval = true;
  }
  /**
   * Create an invalid Interval.
   * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Interval}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidIntervalError(invalid);
    } else {
      return new Interval({ invalid });
    }
  }
  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */
  static fromDateTimes(start, end) {
    const builtStart = friendlyDateTime(start), builtEnd = friendlyDateTime(end);
    const validateError = validateStartEnd(builtStart, builtEnd);
    if (validateError == null) {
      return new Interval({
        start: builtStart,
        end: builtEnd
      });
    } else {
      return validateError;
    }
  }
  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static after(start, duration) {
    const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(start);
    return Interval.fromDateTimes(dt, dt.plus(dur));
  }
  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(end, duration) {
    const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(end);
    return Interval.fromDateTimes(dt.minus(dur), dt);
  }
  /**
   * Create an Interval from an ISO 8601 string.
   * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
   * @param {string} text - the ISO string to parse
   * @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {Interval}
   */
  static fromISO(text, opts) {
    const [s2, e] = (text || "").split("/", 2);
    if (s2 && e) {
      let start, startIsValid;
      try {
        start = DateTime.fromISO(s2, opts);
        startIsValid = start.isValid;
      } catch (e2) {
        startIsValid = false;
      }
      let end, endIsValid;
      try {
        end = DateTime.fromISO(e, opts);
        endIsValid = end.isValid;
      } catch (e2) {
        endIsValid = false;
      }
      if (startIsValid && endIsValid) {
        return Interval.fromDateTimes(start, end);
      }
      if (startIsValid) {
        const dur = Duration.fromISO(e, opts);
        if (dur.isValid) {
          return Interval.after(start, dur);
        }
      } else if (endIsValid) {
        const dur = Duration.fromISO(s2, opts);
        if (dur.isValid) {
          return Interval.before(end, dur);
        }
      }
    }
    return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
  }
  /**
   * Check if an object is an Interval. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isInterval(o) {
    return o && o.isLuxonInterval || false;
  }
  /**
   * Returns the start of the Interval
   * @type {DateTime}
   */
  get start() {
    return this.isValid ? this.s : null;
  }
  /**
   * Returns the end of the Interval
   * @type {DateTime}
   */
  get end() {
    return this.isValid ? this.e : null;
  }
  /**
   * Returns the last DateTime included in the interval (since end is not part of the interval)
   * @type {DateTime}
   */
  get lastDateTime() {
    return this.isValid ? this.e ? this.e.minus(1) : null : null;
  }
  /**
   * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
   * @type {boolean}
   */
  get isValid() {
    return this.invalidReason === null;
  }
  /**
   * Returns an error code if this Interval is invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  length(unit = "milliseconds") {
    return this.isValid ? this.toDuration(...[unit]).get(unit) : NaN;
  }
  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; this operation will always use the locale of the start DateTime
   * @return {number}
   */
  count(unit = "milliseconds", opts) {
    if (!this.isValid) return NaN;
    const start = this.start.startOf(unit, opts);
    let end;
    if (opts?.useLocaleWeeks) {
      end = this.end.reconfigure({ locale: start.locale });
    } else {
      end = this.end;
    }
    end = end.startOf(unit, opts);
    return Math.floor(end.diff(start, unit).get(unit)) + (end.valueOf() !== this.end.valueOf());
  }
  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */
  hasSame(unit) {
    return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, unit) : false;
  }
  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */
  isEmpty() {
    return this.s.valueOf() === this.e.valueOf();
  }
  /**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isAfter(dateTime) {
    if (!this.isValid) return false;
    return this.s > dateTime;
  }
  /**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isBefore(dateTime) {
    if (!this.isValid) return false;
    return this.e <= dateTime;
  }
  /**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  contains(dateTime) {
    if (!this.isValid) return false;
    return this.s <= dateTime && this.e > dateTime;
  }
  /**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */
  set({ start, end } = {}) {
    if (!this.isValid) return this;
    return Interval.fromDateTimes(start || this.s, end || this.e);
  }
  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */
  splitAt(...dateTimes) {
    if (!this.isValid) return [];
    const sorted = dateTimes.map(friendlyDateTime).filter((d) => this.contains(d)).sort((a, b) => a.toMillis() - b.toMillis()), results = [];
    let { s: s2 } = this, i = 0;
    while (s2 < this.e) {
      const added = sorted[i] || this.e, next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s2, next));
      s2 = next;
      i += 1;
    }
    return results;
  }
  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */
  splitBy(duration) {
    const dur = Duration.fromDurationLike(duration);
    if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) {
      return [];
    }
    let { s: s2 } = this, idx = 1, next;
    const results = [];
    while (s2 < this.e) {
      const added = this.start.plus(dur.mapUnits((x) => x * idx));
      next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s2, next));
      s2 = next;
      idx += 1;
    }
    return results;
  }
  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {Array}
   */
  divideEqually(numberOfParts) {
    if (!this.isValid) return [];
    return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
  }
  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */
  overlaps(other) {
    return this.e > other.s && this.s < other.e;
  }
  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsStart(other) {
    if (!this.isValid) return false;
    return +this.e === +other.s;
  }
  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsEnd(other) {
    if (!this.isValid) return false;
    return +other.e === +this.s;
  }
  /**
   * Returns true if this Interval fully contains the specified Interval, specifically if the intersect (of this Interval and the other Interval) is equal to the other Interval; false otherwise.
   * @param {Interval} other
   * @return {boolean}
   */
  engulfs(other) {
    if (!this.isValid) return false;
    return this.s <= other.s && this.e >= other.e;
  }
  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }
    return this.s.equals(other.s) && this.e.equals(other.e);
  }
  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, meaning, the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */
  intersection(other) {
    if (!this.isValid) return this;
    const s2 = this.s > other.s ? this.s : other.s, e = this.e < other.e ? this.e : other.e;
    if (s2 >= e) {
      return null;
    } else {
      return Interval.fromDateTimes(s2, e);
    }
  }
  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(other) {
    if (!this.isValid) return this;
    const s2 = this.s < other.s ? this.s : other.s, e = this.e > other.e ? this.e : other.e;
    return Interval.fromDateTimes(s2, e);
  }
  /**
   * Merge an array of Intervals into a equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static merge(intervals) {
    const [found, final] = intervals.sort((a, b) => a.s - b.s).reduce(
      ([sofar, current], item) => {
        if (!current) {
          return [sofar, item];
        } else if (current.overlaps(item) || current.abutsStart(item)) {
          return [sofar, current.union(item)];
        } else {
          return [sofar.concat([current]), item];
        }
      },
      [[], null]
    );
    if (final) {
      found.push(final);
    }
    return found;
  }
  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static xor(intervals) {
    let start = null, currentCount = 0;
    const results = [], ends = intervals.map((i) => [
      { time: i.s, type: "s" },
      { time: i.e, type: "e" }
    ]), flattened = Array.prototype.concat(...ends), arr = flattened.sort((a, b) => a.time - b.time);
    for (const i of arr) {
      currentCount += i.type === "s" ? 1 : -1;
      if (currentCount === 1) {
        start = i.time;
      } else {
        if (start && +start !== +i.time) {
          results.push(Interval.fromDateTimes(start, i.time));
        }
        start = null;
      }
    }
    return Interval.merge(results);
  }
  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */
  difference(...intervals) {
    return Interval.xor([this].concat(intervals)).map((i) => this.intersection(i)).filter((i) => i && !i.isEmpty());
  }
  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString() {
    if (!this.isValid) return INVALID$1;
    return `[${this.s.toISO()} – ${this.e.toISO()})`;
  }
  /**
   * Returns a string representation of this Interval appropriate for the REPL.
   * @return {string}
   */
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`;
    } else {
      return `Interval { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns a localized string representing this Interval. Accepts the same options as the
   * Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
   * {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
   * is browser-specific, but in general it will return an appropriate representation of the
   * Interval in the assigned locale. Defaults to the system's locale if no locale has been
   * specified.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
   * Intl.DateTimeFormat constructor options.
   * @param {Object} opts - Options to override the configuration of the start DateTime.
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid ? Formatter.create(this.s.loc.clone(opts), formatOpts).formatInterval(this) : INVALID$1;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(opts) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
  }
  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate() {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISODate()}/${this.e.toISODate()}`;
  }
  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISOTime(opts) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;
  }
  /**
   * Returns a string representation of this Interval formatted according to the specified format
   * string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
   * formatting tool.
   * @param {string} dateFormat - The format string. This string formats the start and end time.
   * See {@link DateTime#toFormat} for details.
   * @param {Object} opts - Options.
   * @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
   * representations.
   * @return {string}
   */
  toFormat(dateFormat, { separator = " – " } = {}) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
  }
  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */
  toDuration(unit, opts) {
    if (!this.isValid) {
      return Duration.invalid(this.invalidReason);
    }
    return this.e.diff(this.s, unit, opts);
  }
  /**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */
  mapEndpoints(mapFn) {
    return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
  }
}
class Info {
  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  static hasDST(zone = Settings.defaultZone) {
    const proto = DateTime.now().setZone(zone).set({ month: 12 });
    return !zone.isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
  }
  /**
   * Return whether the specified zone is a valid IANA specifier.
   * @param {string} zone - Zone to check
   * @return {boolean}
   */
  static isValidIANAZone(zone) {
    return IANAZone.isValidZone(zone);
  }
  /**
   * Converts the input into a {@link Zone} instance.
   *
   * * If `input` is already a Zone instance, it is returned unchanged.
   * * If `input` is a string containing a valid time zone name, a Zone instance
   *   with that name is returned.
   * * If `input` is a string that doesn't refer to a known time zone, a Zone
   *   instance with {@link Zone#isValid} == false is returned.
   * * If `input is a number, a Zone instance with the specified fixed offset
   *   in minutes is returned.
   * * If `input` is `null` or `undefined`, the default zone is returned.
   * @param {string|Zone|number} [input] - the value to be converted
   * @return {Zone}
   */
  static normalizeZone(input) {
    return normalizeZone(input, Settings.defaultZone);
  }
  /**
   * Get the weekday on which the week starts according to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number} the start of the week, 1 for Monday through 7 for Sunday
   */
  static getStartOfWeek({ locale = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale)).getStartOfWeek();
  }
  /**
   * Get the minimum number of days necessary in a week before it is considered part of the next year according
   * to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number}
   */
  static getMinimumDaysInFirstWeek({ locale = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale)).getMinDaysInFirstWeek();
  }
  /**
   * Get the weekdays, which are considered the weekend according to the given locale
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number[]} an array of weekdays, 1 for Monday through 7 for Sunday
   */
  static getWeekendWeekdays({ locale = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale)).getWeekendDays().slice();
  }
  /**
   * Return an array of standalone month names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @example Info.months()[0] //=> 'January'
   * @example Info.months('short')[0] //=> 'Jan'
   * @example Info.months('numeric')[0] //=> '1'
   * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
   * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
   * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
   * @return {Array}
   */
  static months(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
  }
  /**
   * Return an array of format month names.
   * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
   * changes the string.
   * See {@link Info#months}
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @return {Array}
   */
  static monthsFormat(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
  }
  /**
   * Return an array of standalone week names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @example Info.weekdays()[0] //=> 'Monday'
   * @example Info.weekdays('short')[0] //=> 'Mon'
   * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
   * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
   * @return {Array}
   */
  static weekdays(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length);
  }
  /**
   * Return an array of format week names.
   * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
   * changes the string.
   * See {@link Info#weekdays}
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale=null] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @return {Array}
   */
  static weekdaysFormat(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length, true);
  }
  /**
   * Return an array of meridiems.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.meridiems() //=> [ 'AM', 'PM' ]
   * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
   * @return {Array}
   */
  static meridiems({ locale = null } = {}) {
    return Locale.create(locale).meridiems();
  }
  /**
   * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
   * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.eras() //=> [ 'BC', 'AD' ]
   * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
   * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
   * @return {Array}
   */
  static eras(length = "short", { locale = null } = {}) {
    return Locale.create(locale, null, "gregory").eras(length);
  }
  /**
   * Return the set of available features in this environment.
   * Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
   * Keys:
   * * `relative`: whether this environment supports relative time formatting
   * * `localeWeek`: whether this environment supports different weekdays for the start of the week based on the locale
   * @example Info.features() //=> { relative: false, localeWeek: true }
   * @return {Object}
   */
  static features() {
    return { relative: hasRelative(), localeWeek: hasLocaleWeekInfo() };
  }
}
function dayDiff(earlier, later) {
  const utcDayStart = (dt) => dt.toUTC(0, { keepLocalTime: true }).startOf("day").valueOf(), ms = utcDayStart(later) - utcDayStart(earlier);
  return Math.floor(Duration.fromMillis(ms).as("days"));
}
function highOrderDiffs(cursor, later, units) {
  const differs = [
    ["years", (a, b) => b.year - a.year],
    ["quarters", (a, b) => b.quarter - a.quarter + (b.year - a.year) * 4],
    ["months", (a, b) => b.month - a.month + (b.year - a.year) * 12],
    [
      "weeks",
      (a, b) => {
        const days = dayDiff(a, b);
        return (days - days % 7) / 7;
      }
    ],
    ["days", dayDiff]
  ];
  const results = {};
  const earlier = cursor;
  let lowestOrder, highWater;
  for (const [unit, differ] of differs) {
    if (units.indexOf(unit) >= 0) {
      lowestOrder = unit;
      results[unit] = differ(cursor, later);
      highWater = earlier.plus(results);
      if (highWater > later) {
        results[unit]--;
        cursor = earlier.plus(results);
        if (cursor > later) {
          highWater = cursor;
          results[unit]--;
          cursor = earlier.plus(results);
        }
      } else {
        cursor = highWater;
      }
    }
  }
  return [cursor, results, highWater, lowestOrder];
}
function diff(earlier, later, units, opts) {
  let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);
  const remainingMillis = later - cursor;
  const lowerOrderUnits = units.filter(
    (u) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(u) >= 0
  );
  if (lowerOrderUnits.length === 0) {
    if (highWater < later) {
      highWater = cursor.plus({ [lowestOrder]: 1 });
    }
    if (highWater !== cursor) {
      results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
    }
  }
  const duration = Duration.fromObject(results, opts);
  if (lowerOrderUnits.length > 0) {
    return Duration.fromMillis(remainingMillis, opts).shiftTo(...lowerOrderUnits).plus(duration);
  } else {
    return duration;
  }
}
const MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";
function intUnit(regex, post = (i) => i) {
  return { regex, deser: ([s2]) => post(parseDigits(s2)) };
}
const NBSP = String.fromCharCode(160);
const spaceOrNBSP = `[ ${NBSP}]`;
const spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");
function fixListRegex(s2) {
  return s2.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
}
function stripInsensitivities(s2) {
  return s2.replace(/\./g, "").replace(spaceOrNBSPRegExp, " ").toLowerCase();
}
function oneOf(strings, startIndex) {
  if (strings === null) {
    return null;
  } else {
    return {
      regex: RegExp(strings.map(fixListRegex).join("|")),
      deser: ([s2]) => strings.findIndex((i) => stripInsensitivities(s2) === stripInsensitivities(i)) + startIndex
    };
  }
}
function offset(regex, groups) {
  return { regex, deser: ([, h, m]) => signedOffset(h, m), groups };
}
function simple(regex) {
  return { regex, deser: ([s2]) => s2 };
}
function escapeToken(value) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function unitForToken(token, loc) {
  const one = digitRegex(loc), two = digitRegex(loc, "{2}"), three = digitRegex(loc, "{3}"), four = digitRegex(loc, "{4}"), six = digitRegex(loc, "{6}"), oneOrTwo = digitRegex(loc, "{1,2}"), oneToThree = digitRegex(loc, "{1,3}"), oneToSix = digitRegex(loc, "{1,6}"), oneToNine = digitRegex(loc, "{1,9}"), twoToFour = digitRegex(loc, "{2,4}"), fourToSix = digitRegex(loc, "{4,6}"), literal = (t) => ({ regex: RegExp(escapeToken(t.val)), deser: ([s2]) => s2, literal: true }), unitate = (t) => {
    if (token.literal) {
      return literal(t);
    }
    switch (t.val) {
      // era
      case "G":
        return oneOf(loc.eras("short"), 0);
      case "GG":
        return oneOf(loc.eras("long"), 0);
      // years
      case "y":
        return intUnit(oneToSix);
      case "yy":
        return intUnit(twoToFour, untruncateYear);
      case "yyyy":
        return intUnit(four);
      case "yyyyy":
        return intUnit(fourToSix);
      case "yyyyyy":
        return intUnit(six);
      // months
      case "M":
        return intUnit(oneOrTwo);
      case "MM":
        return intUnit(two);
      case "MMM":
        return oneOf(loc.months("short", true), 1);
      case "MMMM":
        return oneOf(loc.months("long", true), 1);
      case "L":
        return intUnit(oneOrTwo);
      case "LL":
        return intUnit(two);
      case "LLL":
        return oneOf(loc.months("short", false), 1);
      case "LLLL":
        return oneOf(loc.months("long", false), 1);
      // dates
      case "d":
        return intUnit(oneOrTwo);
      case "dd":
        return intUnit(two);
      // ordinals
      case "o":
        return intUnit(oneToThree);
      case "ooo":
        return intUnit(three);
      // time
      case "HH":
        return intUnit(two);
      case "H":
        return intUnit(oneOrTwo);
      case "hh":
        return intUnit(two);
      case "h":
        return intUnit(oneOrTwo);
      case "mm":
        return intUnit(two);
      case "m":
        return intUnit(oneOrTwo);
      case "q":
        return intUnit(oneOrTwo);
      case "qq":
        return intUnit(two);
      case "s":
        return intUnit(oneOrTwo);
      case "ss":
        return intUnit(two);
      case "S":
        return intUnit(oneToThree);
      case "SSS":
        return intUnit(three);
      case "u":
        return simple(oneToNine);
      case "uu":
        return simple(oneOrTwo);
      case "uuu":
        return intUnit(one);
      // meridiem
      case "a":
        return oneOf(loc.meridiems(), 0);
      // weekYear (k)
      case "kkkk":
        return intUnit(four);
      case "kk":
        return intUnit(twoToFour, untruncateYear);
      // weekNumber (W)
      case "W":
        return intUnit(oneOrTwo);
      case "WW":
        return intUnit(two);
      // weekdays
      case "E":
      case "c":
        return intUnit(one);
      case "EEE":
        return oneOf(loc.weekdays("short", false), 1);
      case "EEEE":
        return oneOf(loc.weekdays("long", false), 1);
      case "ccc":
        return oneOf(loc.weekdays("short", true), 1);
      case "cccc":
        return oneOf(loc.weekdays("long", true), 1);
      // offset/zone
      case "Z":
      case "ZZ":
        return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
      case "ZZZ":
        return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
      // we don't support ZZZZ (PST) or ZZZZZ (Pacific Standard Time) in parsing
      // because we don't have any way to figure out what they are
      case "z":
        return simple(/[a-z_+-/]{1,256}?/i);
      // this special-case "token" represents a place where a macro-token expanded into a white-space literal
      // in this case we accept any non-newline white-space
      case " ":
        return simple(/[^\S\n\r]/);
      default:
        return literal(t);
    }
  };
  const unit = unitate(token) || {
    invalidReason: MISSING_FTP
  };
  unit.token = token;
  return unit;
}
const partTypeStyleToTokenVal = {
  year: {
    "2-digit": "yy",
    numeric: "yyyyy"
  },
  month: {
    numeric: "M",
    "2-digit": "MM",
    short: "MMM",
    long: "MMMM"
  },
  day: {
    numeric: "d",
    "2-digit": "dd"
  },
  weekday: {
    short: "EEE",
    long: "EEEE"
  },
  dayperiod: "a",
  dayPeriod: "a",
  hour12: {
    numeric: "h",
    "2-digit": "hh"
  },
  hour24: {
    numeric: "H",
    "2-digit": "HH"
  },
  minute: {
    numeric: "m",
    "2-digit": "mm"
  },
  second: {
    numeric: "s",
    "2-digit": "ss"
  },
  timeZoneName: {
    long: "ZZZZZ",
    short: "ZZZ"
  }
};
function tokenForPart(part, formatOpts, resolvedOpts) {
  const { type, value } = part;
  if (type === "literal") {
    const isSpace = /^\s+$/.test(value);
    return {
      literal: !isSpace,
      val: isSpace ? " " : value
    };
  }
  const style = formatOpts[type];
  let actualType = type;
  if (type === "hour") {
    if (formatOpts.hour12 != null) {
      actualType = formatOpts.hour12 ? "hour12" : "hour24";
    } else if (formatOpts.hourCycle != null) {
      if (formatOpts.hourCycle === "h11" || formatOpts.hourCycle === "h12") {
        actualType = "hour12";
      } else {
        actualType = "hour24";
      }
    } else {
      actualType = resolvedOpts.hour12 ? "hour12" : "hour24";
    }
  }
  let val = partTypeStyleToTokenVal[actualType];
  if (typeof val === "object") {
    val = val[style];
  }
  if (val) {
    return {
      literal: false,
      val
    };
  }
  return void 0;
}
function buildRegex(units) {
  const re = units.map((u) => u.regex).reduce((f, r) => `${f}(${r.source})`, "");
  return [`^${re}$`, units];
}
function match(input, regex, handlers) {
  const matches = input.match(regex);
  if (matches) {
    const all = {};
    let matchIndex = 1;
    for (const i in handlers) {
      if (hasOwnProperty(handlers, i)) {
        const h = handlers[i], groups = h.groups ? h.groups + 1 : 1;
        if (!h.literal && h.token) {
          all[h.token.val[0]] = h.deser(matches.slice(matchIndex, matchIndex + groups));
        }
        matchIndex += groups;
      }
    }
    return [matches, all];
  } else {
    return [matches, {}];
  }
}
function dateTimeFromMatches(matches) {
  const toField = (token) => {
    switch (token) {
      case "S":
        return "millisecond";
      case "s":
        return "second";
      case "m":
        return "minute";
      case "h":
      case "H":
        return "hour";
      case "d":
        return "day";
      case "o":
        return "ordinal";
      case "L":
      case "M":
        return "month";
      case "y":
        return "year";
      case "E":
      case "c":
        return "weekday";
      case "W":
        return "weekNumber";
      case "k":
        return "weekYear";
      case "q":
        return "quarter";
      default:
        return null;
    }
  };
  let zone = null;
  let specificOffset;
  if (!isUndefined(matches.z)) {
    zone = IANAZone.create(matches.z);
  }
  if (!isUndefined(matches.Z)) {
    if (!zone) {
      zone = new FixedOffsetZone(matches.Z);
    }
    specificOffset = matches.Z;
  }
  if (!isUndefined(matches.q)) {
    matches.M = (matches.q - 1) * 3 + 1;
  }
  if (!isUndefined(matches.h)) {
    if (matches.h < 12 && matches.a === 1) {
      matches.h += 12;
    } else if (matches.h === 12 && matches.a === 0) {
      matches.h = 0;
    }
  }
  if (matches.G === 0 && matches.y) {
    matches.y = -matches.y;
  }
  if (!isUndefined(matches.u)) {
    matches.S = parseMillis(matches.u);
  }
  const vals = Object.keys(matches).reduce((r, k) => {
    const f = toField(k);
    if (f) {
      r[f] = matches[k];
    }
    return r;
  }, {});
  return [vals, zone, specificOffset];
}
let dummyDateTimeCache = null;
function getDummyDateTime() {
  if (!dummyDateTimeCache) {
    dummyDateTimeCache = DateTime.fromMillis(1555555555555);
  }
  return dummyDateTimeCache;
}
function maybeExpandMacroToken(token, locale) {
  if (token.literal) {
    return token;
  }
  const formatOpts = Formatter.macroTokenToFormatOpts(token.val);
  const tokens = formatOptsToTokens(formatOpts, locale);
  if (tokens == null || tokens.includes(void 0)) {
    return token;
  }
  return tokens;
}
function expandMacroTokens(tokens, locale) {
  return Array.prototype.concat(...tokens.map((t) => maybeExpandMacroToken(t, locale)));
}
class TokenParser {
  constructor(locale, format) {
    this.locale = locale;
    this.format = format;
    this.tokens = expandMacroTokens(Formatter.parseFormat(format), locale);
    this.units = this.tokens.map((t) => unitForToken(t, locale));
    this.disqualifyingUnit = this.units.find((t) => t.invalidReason);
    if (!this.disqualifyingUnit) {
      const [regexString, handlers] = buildRegex(this.units);
      this.regex = RegExp(regexString, "i");
      this.handlers = handlers;
    }
  }
  explainFromTokens(input) {
    if (!this.isValid) {
      return { input, tokens: this.tokens, invalidReason: this.invalidReason };
    } else {
      const [rawMatches, matches] = match(input, this.regex, this.handlers), [result, zone, specificOffset] = matches ? dateTimeFromMatches(matches) : [null, null, void 0];
      if (hasOwnProperty(matches, "a") && hasOwnProperty(matches, "H")) {
        throw new ConflictingSpecificationError(
          "Can't include meridiem when specifying 24-hour format"
        );
      }
      return {
        input,
        tokens: this.tokens,
        regex: this.regex,
        rawMatches,
        matches,
        result,
        zone,
        specificOffset
      };
    }
  }
  get isValid() {
    return !this.disqualifyingUnit;
  }
  get invalidReason() {
    return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
  }
}
function explainFromTokens(locale, input, format) {
  const parser = new TokenParser(locale, format);
  return parser.explainFromTokens(input);
}
function parseFromTokens(locale, input, format) {
  const { result, zone, specificOffset, invalidReason } = explainFromTokens(locale, input, format);
  return [result, zone, specificOffset, invalidReason];
}
function formatOptsToTokens(formatOpts, locale) {
  if (!formatOpts) {
    return null;
  }
  const formatter = Formatter.create(locale, formatOpts);
  const df = formatter.dtFormatter(getDummyDateTime());
  const parts = df.formatToParts();
  const resolvedOpts = df.resolvedOptions();
  return parts.map((p) => tokenForPart(p, formatOpts, resolvedOpts));
}
const INVALID = "Invalid DateTime";
const MAX_DATE = 864e13;
function unsupportedZone(zone) {
  return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
}
function possiblyCachedWeekData(dt) {
  if (dt.weekData === null) {
    dt.weekData = gregorianToWeek(dt.c);
  }
  return dt.weekData;
}
function possiblyCachedLocalWeekData(dt) {
  if (dt.localWeekData === null) {
    dt.localWeekData = gregorianToWeek(
      dt.c,
      dt.loc.getMinDaysInFirstWeek(),
      dt.loc.getStartOfWeek()
    );
  }
  return dt.localWeekData;
}
function clone(inst, alts) {
  const current = {
    ts: inst.ts,
    zone: inst.zone,
    c: inst.c,
    o: inst.o,
    loc: inst.loc,
    invalid: inst.invalid
  };
  return new DateTime({ ...current, ...alts, old: current });
}
function fixOffset(localTS, o, tz) {
  let utcGuess = localTS - o * 60 * 1e3;
  const o2 = tz.offset(utcGuess);
  if (o === o2) {
    return [utcGuess, o];
  }
  utcGuess -= (o2 - o) * 60 * 1e3;
  const o3 = tz.offset(utcGuess);
  if (o2 === o3) {
    return [utcGuess, o2];
  }
  return [localTS - Math.min(o2, o3) * 60 * 1e3, Math.max(o2, o3)];
}
function tsToObj(ts, offset2) {
  ts += offset2 * 60 * 1e3;
  const d = new Date(ts);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds()
  };
}
function objToTS(obj, offset2, zone) {
  return fixOffset(objToLocalTS(obj), offset2, zone);
}
function adjustTime(inst, dur) {
  const oPre = inst.o, year = inst.c.year + Math.trunc(dur.years), month = inst.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3, c = {
    ...inst.c,
    year,
    month,
    day: Math.min(inst.c.day, daysInMonth(year, month)) + Math.trunc(dur.days) + Math.trunc(dur.weeks) * 7
  }, millisToAdd = Duration.fromObject({
    years: dur.years - Math.trunc(dur.years),
    quarters: dur.quarters - Math.trunc(dur.quarters),
    months: dur.months - Math.trunc(dur.months),
    weeks: dur.weeks - Math.trunc(dur.weeks),
    days: dur.days - Math.trunc(dur.days),
    hours: dur.hours,
    minutes: dur.minutes,
    seconds: dur.seconds,
    milliseconds: dur.milliseconds
  }).as("milliseconds"), localTS = objToLocalTS(c);
  let [ts, o] = fixOffset(localTS, oPre, inst.zone);
  if (millisToAdd !== 0) {
    ts += millisToAdd;
    o = inst.zone.offset(ts);
  }
  return { ts, o };
}
function parseDataToDateTime(parsed, parsedZone, opts, format, text, specificOffset) {
  const { setZone, zone } = opts;
  if (parsed && Object.keys(parsed).length !== 0 || parsedZone) {
    const interpretationZone = parsedZone || zone, inst = DateTime.fromObject(parsed, {
      ...opts,
      zone: interpretationZone,
      specificOffset
    });
    return setZone ? inst : inst.setZone(zone);
  } else {
    return DateTime.invalid(
      new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`)
    );
  }
}
function toTechFormat(dt, format, allowZ = true) {
  return dt.isValid ? Formatter.create(Locale.create("en-US"), {
    allowZ,
    forceSimple: true
  }).formatDateTimeFromString(dt, format) : null;
}
function toISODate(o, extended) {
  const longFormat = o.c.year > 9999 || o.c.year < 0;
  let c = "";
  if (longFormat && o.c.year >= 0) c += "+";
  c += padStart(o.c.year, longFormat ? 6 : 4);
  if (extended) {
    c += "-";
    c += padStart(o.c.month);
    c += "-";
    c += padStart(o.c.day);
  } else {
    c += padStart(o.c.month);
    c += padStart(o.c.day);
  }
  return c;
}
function toISOTime(o, extended, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone) {
  let c = padStart(o.c.hour);
  if (extended) {
    c += ":";
    c += padStart(o.c.minute);
    if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) {
      c += ":";
    }
  } else {
    c += padStart(o.c.minute);
  }
  if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) {
    c += padStart(o.c.second);
    if (o.c.millisecond !== 0 || !suppressMilliseconds) {
      c += ".";
      c += padStart(o.c.millisecond, 3);
    }
  }
  if (includeOffset) {
    if (o.isOffsetFixed && o.offset === 0 && !extendedZone) {
      c += "Z";
    } else if (o.o < 0) {
      c += "-";
      c += padStart(Math.trunc(-o.o / 60));
      c += ":";
      c += padStart(Math.trunc(-o.o % 60));
    } else {
      c += "+";
      c += padStart(Math.trunc(o.o / 60));
      c += ":";
      c += padStart(Math.trunc(o.o % 60));
    }
  }
  if (extendedZone) {
    c += "[" + o.zone.ianaName + "]";
  }
  return c;
}
const defaultUnitValues = {
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, defaultWeekUnitValues = {
  weekNumber: 1,
  weekday: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, defaultOrdinalUnitValues = {
  ordinal: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
};
const orderedUnits = ["year", "month", "day", "hour", "minute", "second", "millisecond"], orderedWeekUnits = [
  "weekYear",
  "weekNumber",
  "weekday",
  "hour",
  "minute",
  "second",
  "millisecond"
], orderedOrdinalUnits = ["year", "ordinal", "hour", "minute", "second", "millisecond"];
function normalizeUnit(unit) {
  const normalized = {
    year: "year",
    years: "year",
    month: "month",
    months: "month",
    day: "day",
    days: "day",
    hour: "hour",
    hours: "hour",
    minute: "minute",
    minutes: "minute",
    quarter: "quarter",
    quarters: "quarter",
    second: "second",
    seconds: "second",
    millisecond: "millisecond",
    milliseconds: "millisecond",
    weekday: "weekday",
    weekdays: "weekday",
    weeknumber: "weekNumber",
    weeksnumber: "weekNumber",
    weeknumbers: "weekNumber",
    weekyear: "weekYear",
    weekyears: "weekYear",
    ordinal: "ordinal"
  }[unit.toLowerCase()];
  if (!normalized) throw new InvalidUnitError(unit);
  return normalized;
}
function normalizeUnitWithLocalWeeks(unit) {
  switch (unit.toLowerCase()) {
    case "localweekday":
    case "localweekdays":
      return "localWeekday";
    case "localweeknumber":
    case "localweeknumbers":
      return "localWeekNumber";
    case "localweekyear":
    case "localweekyears":
      return "localWeekYear";
    default:
      return normalizeUnit(unit);
  }
}
function guessOffsetForZone(zone) {
  if (zoneOffsetTs === void 0) {
    zoneOffsetTs = Settings.now();
  }
  if (zone.type !== "iana") {
    return zone.offset(zoneOffsetTs);
  }
  const zoneName = zone.name;
  if (!zoneOffsetGuessCache[zoneName]) {
    zoneOffsetGuessCache[zoneName] = zone.offset(zoneOffsetTs);
  }
  return zoneOffsetGuessCache[zoneName];
}
function quickDT(obj, opts) {
  const zone = normalizeZone(opts.zone, Settings.defaultZone);
  if (!zone.isValid) {
    return DateTime.invalid(unsupportedZone(zone));
  }
  const loc = Locale.fromObject(opts);
  let ts, o;
  if (!isUndefined(obj.year)) {
    for (const u of orderedUnits) {
      if (isUndefined(obj[u])) {
        obj[u] = defaultUnitValues[u];
      }
    }
    const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
    if (invalid) {
      return DateTime.invalid(invalid);
    }
    const offsetProvis = guessOffsetForZone(zone);
    [ts, o] = objToTS(obj, offsetProvis, zone);
  } else {
    ts = Settings.now();
  }
  return new DateTime({ ts, zone, loc, o });
}
function diffRelative(start, end, opts) {
  const round = isUndefined(opts.round) ? true : opts.round, format = (c, unit) => {
    c = roundTo(c, round || opts.calendary ? 0 : 2, true);
    const formatter = end.loc.clone(opts).relFormatter(opts);
    return formatter.format(c, unit);
  }, differ = (unit) => {
    if (opts.calendary) {
      if (!end.hasSame(start, unit)) {
        return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
      } else return 0;
    } else {
      return end.diff(start, unit).get(unit);
    }
  };
  if (opts.unit) {
    return format(differ(opts.unit), opts.unit);
  }
  for (const unit of opts.units) {
    const count = differ(unit);
    if (Math.abs(count) >= 1) {
      return format(count, unit);
    }
  }
  return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
}
function lastOpts(argList) {
  let opts = {}, args;
  if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
    opts = argList[argList.length - 1];
    args = Array.from(argList).slice(0, argList.length - 1);
  } else {
    args = Array.from(argList);
  }
  return [opts, args];
}
let zoneOffsetTs;
let zoneOffsetGuessCache = {};
class DateTime {
  /**
   * @access private
   */
  constructor(config) {
    const zone = config.zone || Settings.defaultZone;
    let invalid = config.invalid || (Number.isNaN(config.ts) ? new Invalid("invalid input") : null) || (!zone.isValid ? unsupportedZone(zone) : null);
    this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;
    let c = null, o = null;
    if (!invalid) {
      const unchanged = config.old && config.old.ts === this.ts && config.old.zone.equals(zone);
      if (unchanged) {
        [c, o] = [config.old.c, config.old.o];
      } else {
        const ot = isNumber(config.o) && !config.old ? config.o : zone.offset(this.ts);
        c = tsToObj(this.ts, ot);
        invalid = Number.isNaN(c.year) ? new Invalid("invalid input") : null;
        c = invalid ? null : c;
        o = invalid ? null : ot;
      }
    }
    this._zone = zone;
    this.loc = config.loc || Locale.create();
    this.invalid = invalid;
    this.weekData = null;
    this.localWeekData = null;
    this.c = c;
    this.o = o;
    this.isLuxonDateTime = true;
  }
  // CONSTRUCT
  /**
   * Create a DateTime for the current instant, in the system's time zone.
   *
   * Use Settings to override these default values if needed.
   * @example DateTime.now().toISO() //~> now in the ISO format
   * @return {DateTime}
   */
  static now() {
    return new DateTime({});
  }
  /**
   * Create a local DateTime
   * @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month, 1-indexed
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @example DateTime.local()                                  //~> now
   * @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
   * @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
   * @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
   * @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
   * @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
   * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
   * @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
   * @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
   * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
   * @return {DateTime}
   */
  static local() {
    const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
    return quickDT({ year, month, day, hour, minute, second, millisecond }, opts);
  }
  /**
   * Create a DateTime in UTC
   * @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @param {Object} options - configuration options for the DateTime
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.utc()                                              //~> now
   * @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
   * @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
   * @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
   * @return {DateTime}
   */
  static utc() {
    const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
    opts.zone = FixedOffsetZone.utcInstance;
    return quickDT({ year, month, day, hour, minute, second, millisecond }, opts);
  }
  /**
   * Create a DateTime from a JavaScript Date object. Uses the default zone.
   * @param {Date} date - a JavaScript Date object
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @return {DateTime}
   */
  static fromJSDate(date2, options = {}) {
    const ts = isDate(date2) ? date2.valueOf() : NaN;
    if (Number.isNaN(ts)) {
      return DateTime.invalid("invalid input");
    }
    const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }
    return new DateTime({
      ts,
      zone: zoneToUse,
      loc: Locale.fromObject(options)
    });
  }
  /**
   * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} milliseconds - a number of milliseconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromMillis(milliseconds, options = {}) {
    if (!isNumber(milliseconds)) {
      throw new InvalidArgumentError(
        `fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`
      );
    } else if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) {
      return DateTime.invalid("Timestamp out of range");
    } else {
      return new DateTime({
        ts: milliseconds,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options)
      });
    }
  }
  /**
   * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} seconds - a number of seconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromSeconds(seconds, options = {}) {
    if (!isNumber(seconds)) {
      throw new InvalidArgumentError("fromSeconds requires a numerical input");
    } else {
      return new DateTime({
        ts: seconds * 1e3,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options)
      });
    }
  }
  /**
   * Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.year - a year, such as 1987
   * @param {number} obj.month - a month, 1-12
   * @param {number} obj.day - a day of the month, 1-31, depending on the month
   * @param {number} obj.ordinal - day of the year, 1-365 or 366
   * @param {number} obj.weekYear - an ISO week year
   * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
   * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
   * @param {number} obj.localWeekYear - a week year, according to the locale
   * @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
   * @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
   * @param {number} obj.hour - hour of the day, 0-23
   * @param {number} obj.minute - minute of the hour, 0-59
   * @param {number} obj.second - second of the minute, 0-59
   * @param {number} obj.millisecond - millisecond of the second, 0-999
   * @param {Object} opts - options for creating this DateTime
   * @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
   * @param {string} [opts.locale='system\'s locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
   * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
   * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
   * @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
   * @return {DateTime}
   */
  static fromObject(obj, opts = {}) {
    obj = obj || {};
    const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }
    const loc = Locale.fromObject(opts);
    const normalized = normalizeObject(obj, normalizeUnitWithLocalWeeks);
    const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, loc);
    const tsNow = Settings.now(), offsetProvis = !isUndefined(opts.specificOffset) ? opts.specificOffset : zoneToUse.offset(tsNow), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError(
        "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
      );
    }
    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }
    const useWeekData = definiteWeekDef || normalized.weekday && !containsGregor;
    let units, defaultValues, objNow = tsToObj(tsNow, offsetProvis);
    if (useWeekData) {
      units = orderedWeekUnits;
      defaultValues = defaultWeekUnitValues;
      objNow = gregorianToWeek(objNow, minDaysInFirstWeek, startOfWeek);
    } else if (containsOrdinal) {
      units = orderedOrdinalUnits;
      defaultValues = defaultOrdinalUnitValues;
      objNow = gregorianToOrdinal(objNow);
    } else {
      units = orderedUnits;
      defaultValues = defaultUnitValues;
    }
    let foundFirst = false;
    for (const u of units) {
      const v = normalized[u];
      if (!isUndefined(v)) {
        foundFirst = true;
      } else if (foundFirst) {
        normalized[u] = defaultValues[u];
      } else {
        normalized[u] = objNow[u];
      }
    }
    const higherOrderInvalid = useWeekData ? hasInvalidWeekData(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? hasInvalidOrdinalData(normalized) : hasInvalidGregorianData(normalized), invalid = higherOrderInvalid || hasInvalidTimeData(normalized);
    if (invalid) {
      return DateTime.invalid(invalid);
    }
    const gregorian = useWeekData ? weekToGregorian(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? ordinalToGregorian(normalized) : normalized, [tsFinal, offsetFinal] = objToTS(gregorian, offsetProvis, zoneToUse), inst = new DateTime({
      ts: tsFinal,
      zone: zoneToUse,
      o: offsetFinal,
      loc
    });
    if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) {
      return DateTime.invalid(
        "mismatched weekday",
        `you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`
      );
    }
    if (!inst.isValid) {
      return DateTime.invalid(inst.invalid);
    }
    return inst;
  }
  /**
   * Create a DateTime from an ISO 8601 string
   * @param {string} text - the ISO string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [opts.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromISO('2016-05-25T09:08:34.123')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
   * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
   * @example DateTime.fromISO('2016-W05-4')
   * @return {DateTime}
   */
  static fromISO(text, opts = {}) {
    const [vals, parsedZone] = parseISODate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
  }
  /**
   * Create a DateTime from an RFC 2822 string
   * @param {string} text - the RFC 2822 string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
   * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
   * @return {DateTime}
   */
  static fromRFC2822(text, opts = {}) {
    const [vals, parsedZone] = parseRFC2822Date(text);
    return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
  }
  /**
   * Create a DateTime from an HTTP header date
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @param {string} text - the HTTP header date
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
   * @return {DateTime}
   */
  static fromHTTP(text, opts = {}) {
    const [vals, parsedZone] = parseHTTPDate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "HTTP", opts);
  }
  /**
   * Create a DateTime from an input string and format string.
   * Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromFormat(text, fmt, opts = {}) {
    if (isUndefined(text) || isUndefined(fmt)) {
      throw new InvalidArgumentError("fromFormat requires an input string and a format");
    }
    const { locale = null, numberingSystem = null } = opts, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    }), [vals, parsedZone, specificOffset, invalid] = parseFromTokens(localeToUse, text, fmt);
    if (invalid) {
      return DateTime.invalid(invalid);
    } else {
      return parseDataToDateTime(vals, parsedZone, opts, `format ${fmt}`, text, specificOffset);
    }
  }
  /**
   * @deprecated use fromFormat instead
   */
  static fromString(text, fmt, opts = {}) {
    return DateTime.fromFormat(text, fmt, opts);
  }
  /**
   * Create a DateTime from a SQL date, time, or datetime
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @example DateTime.fromSQL('2017-05-15')
   * @example DateTime.fromSQL('2017-05-15 09:12:34')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
   * @example DateTime.fromSQL('09:12:34.342')
   * @return {DateTime}
   */
  static fromSQL(text, opts = {}) {
    const [vals, parsedZone] = parseSQL(text);
    return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
  }
  /**
   * Create an invalid DateTime.
   * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidDateTimeError(invalid);
    } else {
      return new DateTime({ invalid });
    }
  }
  /**
   * Check if an object is an instance of DateTime. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDateTime(o) {
    return o && o.isLuxonDateTime || false;
  }
  /**
   * Produce the format string for a set of options
   * @param formatOpts
   * @param localeOpts
   * @returns {string}
   */
  static parseFormatForOpts(formatOpts, localeOpts = {}) {
    const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));
    return !tokenList ? null : tokenList.map((t) => t ? t.val : null).join("");
  }
  /**
   * Produce the the fully expanded format token for the locale
   * Does NOT quote characters, so quoted tokens will not round trip correctly
   * @param fmt
   * @param localeOpts
   * @returns {string}
   */
  static expandFormat(fmt, localeOpts = {}) {
    const expanded = expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts));
    return expanded.map((t) => t.val).join("");
  }
  static resetCache() {
    zoneOffsetTs = void 0;
    zoneOffsetGuessCache = {};
  }
  // INFO
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
   * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
   * @return {number}
   */
  get(unit) {
    return this[unit];
  }
  /**
   * Returns whether the DateTime is valid. Invalid DateTimes occur when:
   * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
   * * The DateTime was created by an operation on another invalid date
   * @type {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this DateTime is invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
   *
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
   *
   * @type {string}
   */
  get outputCalendar() {
    return this.isValid ? this.loc.outputCalendar : null;
  }
  /**
   * Get the time zone associated with this DateTime.
   * @type {Zone}
   */
  get zone() {
    return this._zone;
  }
  /**
   * Get the name of the time zone.
   * @type {string}
   */
  get zoneName() {
    return this.isValid ? this.zone.name : null;
  }
  /**
   * Get the year
   * @example DateTime.local(2017, 5, 25).year //=> 2017
   * @type {number}
   */
  get year() {
    return this.isValid ? this.c.year : NaN;
  }
  /**
   * Get the quarter
   * @example DateTime.local(2017, 5, 25).quarter //=> 2
   * @type {number}
   */
  get quarter() {
    return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
  }
  /**
   * Get the month (1-12).
   * @example DateTime.local(2017, 5, 25).month //=> 5
   * @type {number}
   */
  get month() {
    return this.isValid ? this.c.month : NaN;
  }
  /**
   * Get the day of the month (1-30ish).
   * @example DateTime.local(2017, 5, 25).day //=> 25
   * @type {number}
   */
  get day() {
    return this.isValid ? this.c.day : NaN;
  }
  /**
   * Get the hour of the day (0-23).
   * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
   * @type {number}
   */
  get hour() {
    return this.isValid ? this.c.hour : NaN;
  }
  /**
   * Get the minute of the hour (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
   * @type {number}
   */
  get minute() {
    return this.isValid ? this.c.minute : NaN;
  }
  /**
   * Get the second of the minute (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
   * @type {number}
   */
  get second() {
    return this.isValid ? this.c.second : NaN;
  }
  /**
   * Get the millisecond of the second (0-999).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
   * @type {number}
   */
  get millisecond() {
    return this.isValid ? this.c.millisecond : NaN;
  }
  /**
   * Get the week year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 12, 31).weekYear //=> 2015
   * @type {number}
   */
  get weekYear() {
    return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
  }
  /**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */
  get weekNumber() {
    return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
  }
  /**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */
  get weekday() {
    return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
  }
  /**
   * Returns true if this date is on a weekend according to the locale, false otherwise
   * @returns {boolean}
   */
  get isWeekend() {
    return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
  }
  /**
   * Get the day of the week according to the locale.
   * 1 is the first day of the week and 7 is the last day of the week.
   * If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
   * @returns {number}
   */
  get localWeekday() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekday : NaN;
  }
  /**
   * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
   * because the week can start on different days of the week (see localWeekday) and because a different number of days
   * is required for a week to count as the first week of a year.
   * @returns {number}
   */
  get localWeekNumber() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekNumber : NaN;
  }
  /**
   * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
   * differently, see localWeekNumber.
   * @returns {number}
   */
  get localWeekYear() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekYear : NaN;
  }
  /**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */
  get ordinal() {
    return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
  }
  /**
   * Get the human readable short month name, such as 'Oct'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
   * @type {string}
   */
  get monthShort() {
    return this.isValid ? Info.months("short", { locObj: this.loc })[this.month - 1] : null;
  }
  /**
   * Get the human readable long month name, such as 'October'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthLong //=> October
   * @type {string}
   */
  get monthLong() {
    return this.isValid ? Info.months("long", { locObj: this.loc })[this.month - 1] : null;
  }
  /**
   * Get the human readable short weekday, such as 'Mon'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
   * @type {string}
   */
  get weekdayShort() {
    return this.isValid ? Info.weekdays("short", { locObj: this.loc })[this.weekday - 1] : null;
  }
  /**
   * Get the human readable long weekday, such as 'Monday'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
   * @type {string}
   */
  get weekdayLong() {
    return this.isValid ? Info.weekdays("long", { locObj: this.loc })[this.weekday - 1] : null;
  }
  /**
   * Get the UTC offset of this DateTime in minutes
   * @example DateTime.now().offset //=> -240
   * @example DateTime.utc().offset //=> 0
   * @type {number}
   */
  get offset() {
    return this.isValid ? +this.o : NaN;
  }
  /**
   * Get the short human name for the zone's current offset, for example "EST" or "EDT".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameShort() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "short",
        locale: this.locale
      });
    } else {
      return null;
    }
  }
  /**
   * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameLong() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "long",
        locale: this.locale
      });
    } else {
      return null;
    }
  }
  /**
   * Get whether this zone's offset ever changes, as in a DST.
   * @type {boolean}
   */
  get isOffsetFixed() {
    return this.isValid ? this.zone.isUniversal : null;
  }
  /**
   * Get whether the DateTime is in a DST.
   * @type {boolean}
   */
  get isInDST() {
    if (this.isOffsetFixed) {
      return false;
    } else {
      return this.offset > this.set({ month: 1, day: 1 }).offset || this.offset > this.set({ month: 5 }).offset;
    }
  }
  /**
   * Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
   * in this DateTime's zone. During DST changes local time can be ambiguous, for example
   * `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
   * This method will return both possible DateTimes if this DateTime's local time is ambiguous.
   * @returns {DateTime[]}
   */
  getPossibleOffsets() {
    if (!this.isValid || this.isOffsetFixed) {
      return [this];
    }
    const dayMs = 864e5;
    const minuteMs = 6e4;
    const localTS = objToLocalTS(this.c);
    const oEarlier = this.zone.offset(localTS - dayMs);
    const oLater = this.zone.offset(localTS + dayMs);
    const o1 = this.zone.offset(localTS - oEarlier * minuteMs);
    const o2 = this.zone.offset(localTS - oLater * minuteMs);
    if (o1 === o2) {
      return [this];
    }
    const ts1 = localTS - o1 * minuteMs;
    const ts2 = localTS - o2 * minuteMs;
    const c1 = tsToObj(ts1, o1);
    const c2 = tsToObj(ts2, o2);
    if (c1.hour === c2.hour && c1.minute === c2.minute && c1.second === c2.second && c1.millisecond === c2.millisecond) {
      return [clone(this, { ts: ts1 }), clone(this, { ts: ts2 })];
    }
    return [this];
  }
  /**
   * Returns true if this DateTime is in a leap year, false otherwise
   * @example DateTime.local(2016).isInLeapYear //=> true
   * @example DateTime.local(2013).isInLeapYear //=> false
   * @type {boolean}
   */
  get isInLeapYear() {
    return isLeapYear(this.year);
  }
  /**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */
  get daysInMonth() {
    return daysInMonth(this.year, this.month);
  }
  /**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */
  get daysInYear() {
    return this.isValid ? daysInYear(this.year) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */
  get weeksInWeekYear() {
    return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's local week year
   * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
   * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
   * @type {number}
   */
  get weeksInLocalWeekYear() {
    return this.isValid ? weeksInWeekYear(
      this.localWeekYear,
      this.loc.getMinDaysInFirstWeek(),
      this.loc.getStartOfWeek()
    ) : NaN;
  }
  /**
   * Returns the resolved Intl options for this DateTime.
   * This is useful in understanding the behavior of formatting methods
   * @param {Object} opts - the same options as toLocaleString
   * @return {Object}
   */
  resolvedLocaleOptions(opts = {}) {
    const { locale, numberingSystem, calendar } = Formatter.create(
      this.loc.clone(opts),
      opts
    ).resolvedOptions(this);
    return { locale, numberingSystem, outputCalendar: calendar };
  }
  // TRANSFORM
  /**
   * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
   *
   * Equivalent to {@link DateTime#setZone}('utc')
   * @param {number} [offset=0] - optionally, an offset from UTC in minutes
   * @param {Object} [opts={}] - options to pass to `setZone()`
   * @return {DateTime}
   */
  toUTC(offset2 = 0, opts = {}) {
    return this.setZone(FixedOffsetZone.instance(offset2), opts);
  }
  /**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */
  toLocal() {
    return this.setZone(Settings.defaultZone);
  }
  /**
   * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
   *
   * By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
   * @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
   * @param {Object} opts - options
   * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
   * @return {DateTime}
   */
  setZone(zone, { keepLocalTime = false, keepCalendarTime = false } = {}) {
    zone = normalizeZone(zone, Settings.defaultZone);
    if (zone.equals(this.zone)) {
      return this;
    } else if (!zone.isValid) {
      return DateTime.invalid(unsupportedZone(zone));
    } else {
      let newTS = this.ts;
      if (keepLocalTime || keepCalendarTime) {
        const offsetGuess = zone.offset(this.ts);
        const asObj = this.toObject();
        [newTS] = objToTS(asObj, offsetGuess, zone);
      }
      return clone(this, { ts: newTS, zone });
    }
  }
  /**
   * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
   * @param {Object} properties - the properties to set
   * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
   * @return {DateTime}
   */
  reconfigure({ locale, numberingSystem, outputCalendar } = {}) {
    const loc = this.loc.clone({ locale, numberingSystem, outputCalendar });
    return clone(this, { loc });
  }
  /**
   * "Set" the locale. Returns a newly-constructed DateTime.
   * Just a convenient alias for reconfigure({ locale })
   * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
   * @return {DateTime}
   */
  setLocale(locale) {
    return this.reconfigure({ locale });
  }
  /**
   * "Set" the values of specified units. Returns a newly-constructed DateTime.
   * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
   *
   * This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
   * They cannot be mixed with ISO-week units like `weekday`.
   * @param {Object} values - a mapping of units to numbers
   * @example dt.set({ year: 2017 })
   * @example dt.set({ hour: 8, minute: 30 })
   * @example dt.set({ weekday: 5 })
   * @example dt.set({ year: 2005, ordinal: 234 })
   * @return {DateTime}
   */
  set(values) {
    if (!this.isValid) return this;
    const normalized = normalizeObject(values, normalizeUnitWithLocalWeeks);
    const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, this.loc);
    const settingWeekStuff = !isUndefined(normalized.weekYear) || !isUndefined(normalized.weekNumber) || !isUndefined(normalized.weekday), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError(
        "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
      );
    }
    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }
    let mixed;
    if (settingWeekStuff) {
      mixed = weekToGregorian(
        { ...gregorianToWeek(this.c, minDaysInFirstWeek, startOfWeek), ...normalized },
        minDaysInFirstWeek,
        startOfWeek
      );
    } else if (!isUndefined(normalized.ordinal)) {
      mixed = ordinalToGregorian({ ...gregorianToOrdinal(this.c), ...normalized });
    } else {
      mixed = { ...this.toObject(), ...normalized };
      if (isUndefined(normalized.day)) {
        mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
      }
    }
    const [ts, o] = objToTS(mixed, this.o, this.zone);
    return clone(this, { ts, o });
  }
  /**
   * Add a period of time to this DateTime and return the resulting DateTime
   *
   * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @example DateTime.now().plus(123) //~> in 123 milliseconds
   * @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
   * @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
   * @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
   * @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
   * @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
   * @return {DateTime}
   */
  plus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration);
    return clone(this, adjustTime(this, dur));
  }
  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */
  minus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration).negate();
    return clone(this, adjustTime(this, dur));
  }
  /**
   * "Set" this DateTime to the beginning of a unit of time.
   * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
   * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
   * @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
   * @return {DateTime}
   */
  startOf(unit, { useLocaleWeeks = false } = {}) {
    if (!this.isValid) return this;
    const o = {}, normalizedUnit = Duration.normalizeUnit(unit);
    switch (normalizedUnit) {
      case "years":
        o.month = 1;
      // falls through
      case "quarters":
      case "months":
        o.day = 1;
      // falls through
      case "weeks":
      case "days":
        o.hour = 0;
      // falls through
      case "hours":
        o.minute = 0;
      // falls through
      case "minutes":
        o.second = 0;
      // falls through
      case "seconds":
        o.millisecond = 0;
        break;
    }
    if (normalizedUnit === "weeks") {
      if (useLocaleWeeks) {
        const startOfWeek = this.loc.getStartOfWeek();
        const { weekday } = this;
        if (weekday < startOfWeek) {
          o.weekNumber = this.weekNumber - 1;
        }
        o.weekday = startOfWeek;
      } else {
        o.weekday = 1;
      }
    }
    if (normalizedUnit === "quarters") {
      const q = Math.ceil(this.month / 3);
      o.month = (q - 1) * 3 + 1;
    }
    return this.set(o);
  }
  /**
   * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
   * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
   * @return {DateTime}
   */
  endOf(unit, opts) {
    return this.isValid ? this.plus({ [unit]: 1 }).startOf(unit, opts).minus(1) : this;
  }
  // OUTPUT
  /**
   * Returns a string representation of this DateTime formatted according to the specified format string.
   * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
   * Defaults to en-US if no locale has been specified, regardless of the system's locale.
   * @param {string} fmt - the format string
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
   * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
   * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
   * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    return this.isValid ? Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt) : INVALID;
  }
  /**
   * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
   * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
   * of the DateTime in the assigned locale.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toLocaleString(); //=> 4/20/2017
   * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
   * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
   * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
   * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
   * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
   * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid ? Formatter.create(this.loc.clone(opts), formatOpts).formatDateTime(this) : INVALID;
  }
  /**
   * Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
   * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
   * @example DateTime.now().toLocaleParts(); //=> [
   *                                   //=>   { type: 'day', value: '25' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'month', value: '05' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'year', value: '1982' }
   *                                   //=> ]
   */
  toLocaleParts(opts = {}) {
    return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this) : [];
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=false] - add the time zone format extension
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
   * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
   * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
   * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
   * @return {string|null}
   */
  toISO({
    format = "extended",
    suppressSeconds = false,
    suppressMilliseconds = false,
    includeOffset = true,
    extendedZone = false
  } = {}) {
    if (!this.isValid) {
      return null;
    }
    const ext = format === "extended";
    let c = toISODate(this, ext);
    c += "T";
    c += toISOTime(this, ext, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
    return c;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @param {Object} opts - options
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
   * @return {string|null}
   */
  toISODate({ format = "extended" } = {}) {
    if (!this.isValid) {
      return null;
    }
    return toISODate(this, format === "extended");
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */
  toISOWeekDate() {
    return toTechFormat(this, "kkkk-'W'WW-c");
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's time component
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=true] - add the time zone format extension
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
   * @return {string}
   */
  toISOTime({
    suppressMilliseconds = false,
    suppressSeconds = false,
    includeOffset = true,
    includePrefix = false,
    extendedZone = false,
    format = "extended"
  } = {}) {
    if (!this.isValid) {
      return null;
    }
    let c = includePrefix ? "T" : "";
    return c + toISOTime(
      this,
      format === "extended",
      suppressSeconds,
      suppressMilliseconds,
      includeOffset,
      extendedZone
    );
  }
  /**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */
  toRFC2822() {
    return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
   * Specifically, the string conforms to RFC 1123.
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
   * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
   * @return {string}
   */
  toHTTP() {
    return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string|null}
   */
  toSQLDate() {
    if (!this.isValid) {
      return null;
    }
    return toISODate(this, true);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Time
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc().toSQL() //=> '05:15:16.345'
   * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
   * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
   * @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
   * @return {string}
   */
  toSQLTime({ includeOffset = true, includeZone = false, includeOffsetSpace = true } = {}) {
    let fmt = "HH:mm:ss.SSS";
    if (includeZone || includeOffset) {
      if (includeOffsetSpace) {
        fmt += " ";
      }
      if (includeZone) {
        fmt += "z";
      } else if (includeOffset) {
        fmt += "ZZ";
      }
    }
    return toTechFormat(this, fmt, true);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
   * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
   * @return {string}
   */
  toSQL(opts = {}) {
    if (!this.isValid) {
      return null;
    }
    return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
  }
  /**
   * Returns a string representation of this DateTime appropriate for debugging
   * @return {string}
   */
  toString() {
    return this.isValid ? this.toISO() : INVALID;
  }
  /**
   * Returns a string representation of this DateTime appropriate for the REPL.
   * @return {string}
   */
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;
    } else {
      return `DateTime { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Returns the epoch milliseconds of this DateTime.
   * @return {number}
   */
  toMillis() {
    return this.isValid ? this.ts : NaN;
  }
  /**
   * Returns the epoch seconds (including milliseconds in the fractional part) of this DateTime.
   * @return {number}
   */
  toSeconds() {
    return this.isValid ? this.ts / 1e3 : NaN;
  }
  /**
   * Returns the epoch seconds (as a whole number) of this DateTime.
   * @return {number}
   */
  toUnixInteger() {
    return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
  }
  /**
   * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns a BSON serializable equivalent to this DateTime.
   * @return {Date}
   */
  toBSON() {
    return this.toJSDate();
  }
  /**
   * Returns a JavaScript object with this DateTime's year, month, day, and so on.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
   * @return {Object}
   */
  toObject(opts = {}) {
    if (!this.isValid) return {};
    const base = { ...this.c };
    if (opts.includeConfig) {
      base.outputCalendar = this.outputCalendar;
      base.numberingSystem = this.loc.numberingSystem;
      base.locale = this.loc.locale;
    }
    return base;
  }
  /**
   * Returns a JavaScript Date equivalent to this DateTime.
   * @return {Date}
   */
  toJSDate() {
    return new Date(this.isValid ? this.ts : NaN);
  }
  // COMPARE
  /**
   * Return the difference between two DateTimes as a Duration.
   * @param {DateTime} otherDateTime - the DateTime to compare this one to
   * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example
   * var i1 = DateTime.fromISO('1982-05-25T09:45'),
   *     i2 = DateTime.fromISO('1983-10-14T10:30');
   * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
   * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
   * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
   * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
   * @return {Duration}
   */
  diff(otherDateTime, unit = "milliseconds", opts = {}) {
    if (!this.isValid || !otherDateTime.isValid) {
      return Duration.invalid("created by diffing an invalid DateTime");
    }
    const durOpts = { locale: this.locale, numberingSystem: this.numberingSystem, ...opts };
    const units = maybeArray(unit).map(Duration.normalizeUnit), otherIsLater = otherDateTime.valueOf() > this.valueOf(), earlier = otherIsLater ? this : otherDateTime, later = otherIsLater ? otherDateTime : this, diffed = diff(earlier, later, units, durOpts);
    return otherIsLater ? diffed.negate() : diffed;
  }
  /**
   * Return the difference between this DateTime and right now.
   * See {@link DateTime#diff}
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  diffNow(unit = "milliseconds", opts = {}) {
    return this.diff(DateTime.now(), unit, opts);
  }
  /**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval|DateTime}
   */
  until(otherDateTime) {
    return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
  }
  /**
   * Return whether this DateTime is in the same unit of time as another DateTime.
   * Higher-order units must also be identical for this function to return `true`.
   * Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
   * @param {DateTime} otherDateTime - the other DateTime
   * @param {string} unit - the unit of time to check sameness on
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
   * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
   * @return {boolean}
   */
  hasSame(otherDateTime, unit, opts) {
    if (!this.isValid) return false;
    const inputMs = otherDateTime.valueOf();
    const adjustedToZone = this.setZone(otherDateTime.zone, { keepLocalTime: true });
    return adjustedToZone.startOf(unit, opts) <= inputMs && inputMs <= adjustedToZone.endOf(unit, opts);
  }
  /**
   * Equality check
   * Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
   * To compare just the millisecond values, use `+dt1 === +dt2`.
   * @param {DateTime} other - the other DateTime
   * @return {boolean}
   */
  equals(other) {
    return this.isValid && other.isValid && this.valueOf() === other.valueOf() && this.zone.equals(other.zone) && this.loc.equals(other.loc);
  }
  /**
   * Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
   * platform supports Intl.RelativeTimeFormat. Rounds down by default.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
   * @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
   * @param {boolean} [options.round=true] - whether to round the numbers in the output.
   * @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
   * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
   * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
   * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
   * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
   * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
   */
  toRelative(options = {}) {
    if (!this.isValid) return null;
    const base = options.base || DateTime.fromObject({}, { zone: this.zone }), padding = options.padding ? this < base ? -options.padding : options.padding : 0;
    let units = ["years", "months", "days", "hours", "minutes", "seconds"];
    let unit = options.unit;
    if (Array.isArray(options.unit)) {
      units = options.unit;
      unit = void 0;
    }
    return diffRelative(base, this.plus(padding), {
      ...options,
      numeric: "always",
      units,
      unit
    });
  }
  /**
   * Returns a string representation of this date relative to today, such as "yesterday" or "next month".
   * Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
   * @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
   * @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
   */
  toRelativeCalendar(options = {}) {
    if (!this.isValid) return null;
    return diffRelative(options.base || DateTime.fromObject({}, { zone: this.zone }), this, {
      ...options,
      numeric: "auto",
      units: ["years", "months", "days"],
      calendary: true
    });
  }
  /**
   * Return the min of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
   * @return {DateTime} the min DateTime, or undefined if called with no argument
   */
  static min(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("min requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i) => i.valueOf(), Math.min);
  }
  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */
  static max(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("max requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i) => i.valueOf(), Math.max);
  }
  // MISC
  /**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */
  static fromFormatExplain(text, fmt, options = {}) {
    const { locale = null, numberingSystem = null } = options, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    return explainFromTokens(localeToUse, text, fmt);
  }
  /**
   * @deprecated use fromFormatExplain instead
   */
  static fromStringExplain(text, fmt, options = {}) {
    return DateTime.fromFormatExplain(text, fmt, options);
  }
  /**
   * Build a parser for `fmt` using the given locale. This parser can be passed
   * to {@link DateTime.fromFormatParser} to a parse a date in this format. This
   * can be used to optimize cases where many dates need to be parsed in a
   * specific format.
   *
   * @param {String} fmt - the format the string is expected to be in (see
   * description)
   * @param {Object} options - options used to set locale and numberingSystem
   * for parser
   * @returns {TokenParser} - opaque object to be used
   */
  static buildFormatParser(fmt, options = {}) {
    const { locale = null, numberingSystem = null } = options, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    return new TokenParser(localeToUse, fmt);
  }
  /**
   * Create a DateTime from an input string and format parser.
   *
   * The format parser must have been created with the same locale as this call.
   *
   * @param {String} text - the string to parse
   * @param {TokenParser} formatParser - parser from {@link DateTime.buildFormatParser}
   * @param {Object} opts - options taken by fromFormat()
   * @returns {DateTime}
   */
  static fromFormatParser(text, formatParser, opts = {}) {
    if (isUndefined(text) || isUndefined(formatParser)) {
      throw new InvalidArgumentError(
        "fromFormatParser requires an input string and a format parser"
      );
    }
    const { locale = null, numberingSystem = null } = opts, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    if (!localeToUse.equals(formatParser.locale)) {
      throw new InvalidArgumentError(
        `fromFormatParser called with a locale of ${localeToUse}, but the format parser was created for ${formatParser.locale}`
      );
    }
    const { result, zone, specificOffset, invalidReason } = formatParser.explainFromTokens(text);
    if (invalidReason) {
      return DateTime.invalid(invalidReason);
    } else {
      return parseDataToDateTime(
        result,
        zone,
        opts,
        `format ${formatParser.format}`,
        text,
        specificOffset
      );
    }
  }
  // FORMAT PRESETS
  /**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */
  static get DATE_SHORT() {
    return DATE_SHORT;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED() {
    return DATE_MED;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED_WITH_WEEKDAY() {
    return DATE_MED_WITH_WEEKDAY;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */
  static get DATE_FULL() {
    return DATE_FULL;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */
  static get DATE_HUGE() {
    return DATE_HUGE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_SIMPLE() {
    return TIME_SIMPLE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SECONDS() {
    return TIME_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SHORT_OFFSET() {
    return TIME_WITH_SHORT_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_LONG_OFFSET() {
    return TIME_WITH_LONG_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_SIMPLE() {
    return TIME_24_SIMPLE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SECONDS() {
    return TIME_24_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SHORT_OFFSET() {
    return TIME_24_WITH_SHORT_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_LONG_OFFSET() {
    return TIME_24_WITH_LONG_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT() {
    return DATETIME_SHORT;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT_WITH_SECONDS() {
    return DATETIME_SHORT_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED() {
    return DATETIME_MED;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_SECONDS() {
    return DATETIME_MED_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_WEEKDAY() {
    return DATETIME_MED_WITH_WEEKDAY;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL() {
    return DATETIME_FULL;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL_WITH_SECONDS() {
    return DATETIME_FULL_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE() {
    return DATETIME_HUGE;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE_WITH_SECONDS() {
    return DATETIME_HUGE_WITH_SECONDS;
  }
}
function friendlyDateTime(dateTimeish) {
  if (DateTime.isDateTime(dateTimeish)) {
    return dateTimeish;
  } else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) {
    return DateTime.fromJSDate(dateTimeish);
  } else if (dateTimeish && typeof dateTimeish === "object") {
    return DateTime.fromObject(dateTimeish);
  } else {
    throw new InvalidArgumentError(
      `Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`
    );
  }
}
class PropertyDefHelper {
  static isGroup(property, key) {
    if (!property)
      return false;
    if (property.radmin?.excludeFromTable === true)
      return true;
    if (property.format === "group")
      return true;
    if (key.toLowerCase().includes("group"))
      return true;
    if ((property.title || "").toLowerCase().includes("group"))
      return true;
    if (property.type === "array") {
      const items = property.items;
      if (items && items.properties && (items.properties.Title || items.properties.title)) {
        return true;
      }
    }
    return false;
  }
}
class ServiceBase {
  constructor({ name, enableDebug }) {
    this.debugAll = false;
    this.name = name;
    this.enableDebug = enableDebug ?? false;
  }
  /**
   * Helper method for logging when debug is enabled
   */
  log(...args) {
    if (this.debugAll || this.enableDebug)
      console.log(`[${this.name}]`, ...args);
  }
  retLog(value, ...args) {
    this.log(...args);
    return value;
  }
}
class SchemaHelper extends ServiceBase {
  constructor(schema) {
    super({ name: "SchemaHelper", enableDebug: false });
    this.schema = schema;
  }
  /** Normalize field names against schema property keys. */
  findCasing(field) {
    if (!field || !this.schema?.properties)
      return field;
    const keys = Object.keys(this.schema.properties);
    const exact = keys.find((k) => k === field);
    if (exact)
      return exact;
    const fieldLc = field.toLowerCase();
    const ci = keys.find((k) => k.toLowerCase() === fieldLc);
    if (ci)
      return ci;
    if (fieldLc == "id")
      return "id";
    if (fieldLc == "guid")
      return "guid";
    return field;
  }
}
class RadTabValueLookup extends ServiceBase {
  constructor(schema, cellData) {
    super({ name: "RadTabValueLookup", enableDebug: false });
    this.schema = schema;
    this.cellData = cellData;
  }
  resolveValue(path) {
    return this.getNestedValue(path);
  }
  /** Case-insensitive nested lookup for dotted paths. */
  getNestedValue(key) {
    if (!this.cellData || !key)
      return void 0;
    try {
      let cur = this.cellData;
      for (const part of key.split(".")) {
        if (cur == null)
          return void 0;
        const lower = part.toLowerCase();
        const match2 = cur[part] ?? cur[Object.keys(cur).find((k) => k.toLowerCase() === lower)] ?? cur[part.charAt(0).toLowerCase() + part.slice(1)] ?? cur[lower];
        if (match2 === void 0)
          return void 0;
        cur = match2;
      }
      return cur;
    } catch {
      return void 0;
    }
  }
  /** Replaces [Key] or [Parent.Child] placeholders. */
  resolveTemplate(template) {
    if (!template)
      return "";
    this.log("resolve template/data", { template, data: this.cellData });
    try {
      const result = template.replace(/\[([^\]]+)\]/g, (_m, rawKey) => {
        if (!rawKey)
          return "";
        const key = this.schema && !rawKey.includes(".") ? new SchemaHelper(this.schema).findCasing(rawKey) : rawKey;
        let val = this.cellData?.[key];
        if (val === void 0)
          val = this.getNestedValue(key);
        if (val == null)
          return "";
        if (typeof val === "object") {
          try {
            val = JSON.stringify(val);
          } catch {
            val = String(val);
          }
        }
        return encodeURIComponent(String(val));
      });
      this.log("replaceParameters result", { template, result });
      return result;
    } catch (err) {
      this.log("replaceParameters error", err);
      return "";
    }
  }
}
class RadTabFormatAdapter extends ServiceBase {
  constructor() {
    super({ name: "RadTabFormatAdapter", enableDebug: true });
  }
  /** Maps JSON schema type/format → internal format key */
  static mapSchemaTypeToFormat(property, log) {
    if (!property) return "";
    if (property.format === "date-time") {
      log?.("mapSchemaTypeToFormat: using 'date-time'", { property });
      return "date-time";
    }
    if (property.format === "date") {
      log?.("mapSchemaTypeToFormat: using 'date'", { property });
      return "date";
    }
    if (property.format === "uri" || property.format === "email") {
      log?.("mapSchemaTypeToFormat: using 'link'", { property });
      return "link";
    }
    log?.("mapSchemaTypeToFormat: falling back to type", property.type);
    return property.type;
  }
  /** Normalizes the field and maps to format via schema */
  static getFormatFromSchema(field, schema, log) {
    const normalized = new SchemaHelper(schema).findCasing(field);
    const property = schema.properties[normalized];
    const format = property ? RadTabFormatAdapter.mapSchemaTypeToFormat(property, log) : "";
    log?.("getFormatFromSchema", { field, normalized, format });
    return format;
  }
  /** Title formatter for object and array fields */
  static objectTitleFormatter(cell) {
    const value = cell.getValue();
    if (!value) return "";
    if (Array.isArray(value)) {
      if (value.length === 0) return "";
      const first = value[0];
      const title = first?.Title ?? first?.title ?? JSON.stringify(first);
      const extra = value.length > 1 ? ` +${value.length - 1}` : "";
      return `${title}${extra}`;
    }
    if (typeof value === "object") {
      return value.Title ?? value.title ?? JSON.stringify(value);
    }
    return String(value);
  }
}
const _HtmlStripper = class _HtmlStripper {
  static log(...args) {
    if (this.debug) console.log("[HtmlStripper]", ...args);
  }
  /**
   * Quick heuristic: does this look like HTML or encoded HTML?
   */
  static looksLikeHtml(value) {
    if (value === null || value === void 0) return false;
    const s2 = String(value);
    return /<[a-zA-Z][\s\S]*>|&lt;|\\u003c|\\u003e/i.test(s2);
  }
  /**
   * Decode entities and unicode-escaped sequences into a usable HTML string.
   * Uses DOM decoding where available, falls back to simple replacements.
   */
  static decodeEntities(input) {
    if (!input) return "";
    let s2 = input.replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">");
    this.log("decodeEntities: after unicode normalization:", s2);
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = s2;
      return div.textContent ?? div.innerText ?? "";
    }
    return s2.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  /**
   * Remove HTML tags from a string. Uses DOM if possible otherwise naive regex strip.
   */
  static stripHtml(html2) {
    if (!html2) return "";
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = html2;
      return div.textContent ?? div.innerText ?? "";
    }
    return html2.replace(/<\/?[^>]+(>|$)/g, "");
  }
  /**
   * Combined helper: decode entities then strip tags -> plain text
   */
  static decodeAndStrip(value) {
    if (value === null || value === void 0) return "";
    const s2 = String(value);
    return _HtmlStripper.stripHtml(_HtmlStripper.decodeEntities(s2));
  }
  /**
   * Schema-aware check: does the SchemaProperty indicate a rich/html input?
   * Accepts values like "string-wysiwyg", "wysiwyg", "html", "richtext", etc.
   *
   * We check inputType, format, description, name and title (for backends that put metadata in non-standard fields).
   */
  static schemaPropertyIndicatesHtml(prop) {
    if (!prop) return false;
    const combined = [
      prop.inputType,
      prop.format,
      prop.description,
      prop.name,
      prop.title
    ].filter(Boolean).join(" ").toLowerCase();
    return /(wysiwyg|html|rich|editor|ckeditor|tinymce)/.test(combined);
  }
};
_HtmlStripper.debug = false;
_HtmlStripper.plainTextFormatter = (cell) => {
  try {
    const val = cell?.getValue?.();
    return _HtmlStripper.decodeAndStrip(val);
  } catch (err) {
    _HtmlStripper.log("plainTextFormatter error:", err);
    return "";
  }
};
let HtmlStripper = _HtmlStripper;
const formatConfigs = {
  "": {},
  number: {
    hozAlign: "right"
  },
  boolean: {
    hozAlign: "center",
    formatter: "tickCross"
  },
  date: {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "dd/MM/yy"
    }
  },
  "date-time": {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "dd/MM/yy HH:mm:ss"
    }
  },
  time: {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "HH:mm:ss"
    }
  },
  progress: {
    formatter: "progress",
    formatterParams: {
      min: 0,
      max: 100,
      color: ["#31B4E8"]
    }
  }
};
class FormatAndSortHelper extends ServiceBase {
  constructor() {
    super({ name: "FormatAndSortHelper", enableDebug: true });
  }
  getFormatAndSortOfPropertyUnspecified(schema, key) {
    const property = schema.properties[key];
    const format = RadTabFormatAdapter.mapSchemaTypeToFormat(property);
    return this.getFormatAndSort(format, key, property);
  }
  getFormatAndSort(format, key, property, isLink = false) {
    const formatConfig = formatConfigs[format] || {};
    this.log("Auto-adding column for key:", key, { format, formatConfig });
    let formatter = property.type === "object" || property.type === "array" ? RadTabFormatAdapter.objectTitleFormatter : formatConfig.formatter;
    if (!isLink && !formatter && HtmlStripper.schemaPropertyIndicatesHtml(property)) {
      this.log("Auto-injecting plainTextFormatter for auto-added html field:", key);
      formatter = HtmlStripper.plainTextFormatter;
    }
    let sorter = property.type === "object" || property.type === "array" ? "object" : formatConfig.sorter || void 0;
    if (isLink) {
      this.log(`Overriding sorter to 'string' for linked object/array field '${key}'`);
      sorter = "string";
    }
    return {
      ...formatConfig,
      formatter,
      sorter
    };
  }
}
class TabulatorColumnAdapter extends ServiceBase {
  constructor() {
    super({ name: "TabulatorColumnAdapter", enableDebug: true });
  }
  #formatAndSortHelper = new FormatAndSortHelper();
  convert(columnConfigs, columnsAutoShowRemaining, schema) {
    this.log("convert called with", {
      columnConfigLength: columnConfigs.length,
      columnsAutoShowRemaining,
      schemaProperties: Object.keys(schema.properties).length,
      columnConfigs
    });
    const columns = columnConfigs.map((col) => {
      const fieldName = new SchemaHelper(schema).findCasing(col.fieldValue);
      const prop = schema.properties[fieldName];
      this.log(`configured column: '${col.fieldValue}' to '${fieldName}'`, { col }, `schemaProp:`, prop);
      if (PropertyDefHelper.isGroup(prop, fieldName))
        return this.retLog(null, `Skipping configured column because it references a group property: '${fieldName}'`, col);
      return { fieldName, col, prop };
    }).filter((c) => !!c);
    const configuredColumns = columns.map(({ fieldName, col, prop }) => {
      const chosenFormat = col.fieldFormat || RadTabFormatAdapter.getFormatFromSchema(col.fieldValue, schema);
      const formatAndSort = this.#formatAndSortHelper.getFormatAndSort(chosenFormat, fieldName, prop || { type: "string" }, !!col.linkEnable);
      const hAlign = col.horizontalAlignment !== "automatic" ? col.horizontalAlignment : void 0;
      const column = {
        title: col.title,
        field: fieldName,
        headerTooltip: col.headerTooltip || false,
        ...formatAndSort,
        // Only set alignment if explicitly specified
        hozAlign: hAlign,
        headerHozAlign: hAlign,
        // Only set width if explicitly specified
        width: col.width !== "automatic" ? col.width : void 0,
        // Handle tooltip configuration
        tooltip: !col.tooltipEnabled ? false : col.fieldTooltip ? (e, cell, _) => new RadTabValueLookup(schema, cell.getData()).resolveTemplate(col.fieldTooltip) : true,
        ...this.linkFormatter(schema, col, fieldName)
      };
      return this.retLog(column, `Final column config for field '${fieldName}'`);
    }).filter((c) => !!c);
    this.log(`Configured columns built: ${configuredColumns.length}`);
    if (!columnsAutoShowRemaining && configuredColumns.length > 0)
      return this.retLog(configuredColumns, "columnsAutoShowRemaining is false — returning configured columns only");
    return this.tryAddRemainingColumns(schema, configuredColumns);
  }
  /**
   * Try to add remaining columns from the schema that are not already configured.
   * @param schema The JSON schema defining the properties.
   * @param configuredColumns The columns that have already been configured.
   * @returns An array of TabulatorColumnConfig including the newly added columns.
   */
  tryAddRemainingColumns(schema, configuredColumns) {
    const configuredFields = new Set(configuredColumns.filter((col) => !!col).map((col) => col.field));
    this.log("Configured fields set:", Array.from(configuredFields));
    const remainingColumns = this.defineRemainingColumns(schema, configuredFields);
    this.log(`Remaining columns built: ${remainingColumns.length}`);
    return [...configuredColumns, ...remainingColumns];
  }
  /**
   * Define remaining columns from the schema that are not already configured.
   * @param schema The JSON schema defining the properties.
   * @param configuredFields The set of fields that have already been configured.
   * @returns An array of TabulatorColumnConfig for the remaining columns.
   */
  defineRemainingColumns(schema, configuredFields) {
    this.log("Defining remaining columns from schema. Total properties:", { schema, configuredFields });
    const keysToUse = Object.keys(schema.properties).filter((key) => !configuredFields.has(key)).filter((key) => {
      const prop = schema.properties[key];
      const isGroup = PropertyDefHelper.isGroup(prop, key);
      if (isGroup)
        this.log("Skipping auto-add of group property:", key);
      return !isGroup;
    });
    return keysToUse.map((key) => {
      const property = schema.properties[key];
      const formatAndSort = this.#formatAndSortHelper.getFormatAndSortOfPropertyUnspecified(schema, key);
      const col = {
        title: property.title || key,
        field: key,
        ...formatAndSort
      };
      this.log("Built auto column config for key:", key, col);
      return col;
    });
  }
  /**
   * Configure link if enabled
   */
  linkFormatter(schema, col, normalizedField) {
    if (!col.linkEnable)
      return {};
    this.log(`Link enabled for column '${normalizedField}'`, {
      linkViewRef: col.linkViewRef,
      linkParameters: col.linkParameters
    });
    return {
      formatter: "link",
      formatterParams: {
        url: (cell) => {
          const valLookup = new RadTabValueLookup(schema, cell.getData());
          const params = valLookup.resolveTemplate(col.linkParameters);
          const expectedParams = col.linkViewRef?.expectedParameters;
          this.log(`Expected parameters for link: '${expectedParams}'`, { col });
          const addParams = expectedParams ? valLookup.resolveTemplate(expectedParams) : "";
          const allParams = {
            // Requested params goes first
            ...Object.fromEntries(new URLSearchParams(addParams)),
            // Added by current view configuration last, has precedence over any conflicting keys in the requested params
            ...Object.fromEntries(new URLSearchParams(params))
          };
          if (col.linkType == "url") {
            const urlParams = this.combineUrlParams(allParams);
            this.log(`Generated URL for cell '${normalizedField}': '${urlParams}'`, { addParams, params });
            return `${col.linkUrl}${urlParams ? "?" + urlParams : ""}`;
          }
          const viewId = col.linkViewRef?.viewId || valLookup.resolveTemplate(col.linkViewId || "") || "unknown";
          const url = "?" + this.combineUrlParams({
            viewId,
            ...allParams
          });
          this.log(`Generated link url for cell '${normalizedField}' to: '${url}'`);
          return url;
        },
        target: col.linkTarget || "_self",
        label: (cell) => RadTabFormatAdapter.objectTitleFormatter(cell)
      }
    };
  }
  combineUrlParams(params) {
    const url = new URL("", window.location.origin);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.searchParams.toString();
  }
}
class RadTabColumnSortParser extends ServiceBase {
  constructor() {
    super({ name: "RadTabColumnSortParser", enableDebug: false });
  }
  loadFromSettings(schema, columns, sortString) {
    const parsedInitialSort = this.#parse(
      sortString,
      columns,
      schema
    );
    const initialSortForTabulator = parsedInitialSort.length > 0 ? [...parsedInitialSort].reverse() : void 0;
    return initialSortForTabulator;
  }
  #parse(sortString, columns, schema) {
    if (!sortString) return [];
    let input = sortString.trim();
    if (input.startsWith('"') && input.endsWith('"') || input.startsWith("'") && input.endsWith("'")) {
      input = input.slice(1, -1).trim();
      this.log("stripped outer quotes from input:", input);
    } else {
      this.log("parse called with:", input);
    }
    const normalize = (s2 = "") => s2.replace(/^["']|["']$/g, "").trim();
    let tokens = input.match(/(?:[^,"']+|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')+/g)?.map((t) => t.trim()).filter(Boolean) || [];
    this.log("initial tokens:", tokens);
    if (tokens.length === 1 && tokens[0].includes(":")) {
      const parts = tokens[0].split(":").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2 && parts.length % 2 === 0) {
        const rebuilt = [];
        for (let i = 0; i < parts.length; i += 2) {
          rebuilt.push(`${parts[i]}:${parts[i + 1]}`);
        }
        tokens = rebuilt;
        this.log("rebuilt tokens from colon-only input:", tokens);
      } else {
        this.log("colon-only token present but parts are not even - parts:", parts);
      }
    }
    const colFieldByLower = /* @__PURE__ */ new Map();
    const colTitleByLower = /* @__PURE__ */ new Map();
    const colTitleByNormalized = /* @__PURE__ */ new Map();
    (columns || []).forEach((c) => {
      if (c.field)
        colFieldByLower.set(c.field.toLowerCase(), c.field);
      if (c.title) {
        const titleStr = c.title.toString();
        colTitleByLower.set(titleStr.toLowerCase(), c.field ?? titleStr);
        colTitleByNormalized.set(
          titleStr.toLowerCase().replace(/\s+/g, ""),
          c.field ?? titleStr
        );
      }
    });
    this.log("column lookup sizes:", {
      fields: colFieldByLower.size,
      titles: colTitleByLower.size,
      titlesNormalized: colTitleByNormalized.size
    });
    const schemaProps = schema?.properties || {};
    const schemaKeys = Object.keys(schemaProps);
    const schemaKeyByLower = /* @__PURE__ */ new Map();
    const schemaTitleByLower = /* @__PURE__ */ new Map();
    const schemaTitleByNormalized = /* @__PURE__ */ new Map();
    schemaKeys.forEach((k) => {
      schemaKeyByLower.set(k.toLowerCase(), k);
      const title = (schemaProps[k]?.title || "").toString();
      if (title) {
        schemaTitleByLower.set(title.toLowerCase(), k);
        schemaTitleByNormalized.set(title.toLowerCase().replace(/\s+/g, ""), k);
      }
    });
    this.log("schema lookup sizes:", {
      keys: schemaKeyByLower.size,
      titles: schemaTitleByLower.size,
      titlesNormalized: schemaTitleByNormalized.size
    });
    const resolveToField = (rawName) => {
      const cleaned = normalize(rawName);
      const lower = cleaned.toLowerCase();
      const normalized = lower.replace(/\s+/g, "");
      const byField = colFieldByLower.get(lower);
      if (byField) {
        this.log(`resolved "${rawName}" => column.field (by field):`, byField);
        return byField;
      }
      const byTitle = colTitleByLower.get(lower) ?? colTitleByNormalized.get(normalized);
      if (byTitle) {
        this.log(`resolved "${rawName}" => column.field (by title):`, byTitle);
        return byTitle;
      }
      const bySchemaKey = schemaKeyByLower.get(lower);
      if (bySchemaKey) {
        this.log(`resolved "${rawName}" => schema key:`, bySchemaKey);
        return bySchemaKey;
      }
      const bySchemaTitle = schemaTitleByLower.get(lower) ?? schemaTitleByNormalized.get(normalized);
      if (bySchemaTitle) {
        this.log(`resolved "${rawName}" => schema title:`, bySchemaTitle);
        return bySchemaTitle;
      }
      this.log(`fallback resolution for "${rawName}" =>`, cleaned);
      return cleaned;
    };
    const result = tokens.map((segment) => {
      const token = normalize(segment);
      const idx = token.indexOf(":");
      const namePart = idx === -1 ? token : token.substring(0, idx);
      const dirPart = idx === -1 ? "" : token.substring(idx + 1);
      const nameToken = normalize(namePart);
      const dirToken = normalize(dirPart).toLowerCase();
      const dir = /^(-|desc|descending|d)/.test(dirToken) ? "desc" : "asc";
      const resolved = {
        // use Tabulator's expected property name when passing sorts in
        column: resolveToField(nameToken),
        dir
      };
      this.log("parsed segment:", {
        raw: segment,
        token,
        nameToken,
        dirToken,
        resolved
      });
      return resolved;
    });
    this.log("final parsed sorters:", result);
    return result;
  }
}
class ErrorHelper {
  /**
   * Convert unknown error into a safe string for logging and UI.
   */
  static toErrorString(err) {
    try {
      if (err === void 0) return "undefined";
      if (err === null) return "null";
      if (typeof err === "string") return err;
      if (err instanceof Error) return err.message || String(err);
      const anyErr = err;
      if (typeof anyErr === "object") {
        if (typeof anyErr.message === "string") return anyErr.message;
        if (typeof anyErr.toString === "function") return anyErr.toString();
        try {
          return JSON.stringify(anyErr);
        } catch {
          return String(anyErr);
        }
      }
      return String(err);
    } catch (e) {
      return "unknown error";
    }
  }
  /**
   * Quick heuristic to detect authentication/401 errors.
   * Accepts plain error strings, objects with `.status`, and Error instances.
   */
  static isAuthError(err) {
    try {
      if (typeof err === "object" && err !== null) {
        const anyErr = err;
        if (typeof anyErr.status === "number" && anyErr.status === 401) return true;
        if (typeof anyErr.statusCode === "number" && anyErr.statusCode === 401) return true;
      }
      const s2 = ErrorHelper.toErrorString(err);
      return s2.includes("401") || /unauthori(s|z)ed/i.test(s2);
    } catch {
      return false;
    }
  }
  /**
   * Render a Bootstrap alert into the target container.
   *
   * containerId: typically the table id (e.g. 'radmin-id-123'). If an element with that id isn't found
   * the helper will attempt to use an error container id variant by replacing the prefix:
   *  radmin-id-123 -> radmin-id-error-123
   */
  static showAlert(containerId, title, message, type = "danger") {
    try {
      const container = document.getElementById(containerId);
      const errorContainerId = containerId.replace(/^radmin-id-/, "radmin-id-error-");
      const errorContainer = document.getElementById(errorContainerId);
      const target = errorContainer || container;
      if (!target) {
        console.warn("ErrorHelper.showAlert: no target container found for", containerId, errorContainerId);
        console.warn(`${title}: ${message}`);
        return;
      }
      target.innerHTML = "";
      const alert = document.createElement("div");
      alert.className = `alert alert-${type} alert-dismissible fade show`;
      alert.setAttribute("role", "alert");
      alert.innerHTML = `
        <h4 class="alert-heading" style="margin-top:0;margin-bottom:.25rem;">${title}</h4>
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      target.appendChild(alert);
    } catch (e) {
      console.error("ErrorHelper.showAlert failed:", e);
    }
  }
  /**
   * Show a friendly message for configuration load failures (e.g. 401s).
   * containerId should be the table container id (e.g. 'radmin-id-123').
   */
  static handleLoadConfigError(containerId, err) {
    const errStr = ErrorHelper.toErrorString(err);
    if (ErrorHelper.isAuthError(err)) {
      ErrorHelper.showAlert(
        containerId,
        "Authentication Required",
        "You need to be logged in to view this table.",
        "warning"
      );
    } else {
      ErrorHelper.showAlert(
        containerId,
        "Configuration Error",
        `Failed to load table configuration. ${errStr}`
      );
    }
  }
  /**
   * Show a friendly message for table creation / data/schema errors.
   */
  static handleCreateTableError(containerId, err) {
    const errStr = ErrorHelper.toErrorString(err);
    if (/schema/i.test(errStr) || errStr.includes("Cannot read properties of undefined")) {
      ErrorHelper.showAlert(
        containerId,
        "Schema Error",
        "Failed to load schema data. This often happens when you're not logged in or don't have appropriate permissions."
      );
      return;
    }
    if (ErrorHelper.isAuthError(err)) {
      ErrorHelper.showAlert(
        containerId,
        "Authentication Required",
        "You need to be logged in to access this data.",
        "warning"
      );
      return;
    }
    ErrorHelper.showAlert(
      containerId,
      "Table Creation Error",
      `There was a problem creating the table. ${errStr}`
    );
  }
}
class RadTabSetupSort extends ServiceBase {
  constructor() {
    super({ name: "RadTabSetupSort", enableDebug: true });
  }
  loadSortFromSession(tableName) {
    const savedSortersJson = sessionStorage.getItem(`${tableName}-sorters`);
    if (!savedSortersJson)
      return null;
    try {
      const savedSorters = JSON.parse(savedSortersJson);
      if (Array.isArray(savedSorters) && savedSorters.length > 0)
        return this.retLog(savedSorters, `Loaded saved sorters for ${tableName}`);
    } catch (err) {
      this.log(`Failed to parse saved sorters for ${tableName}`, err);
    }
    return null;
  }
  setupInitialSort(table, tabulatorOptions, tableName) {
    const initialSortRaw = tabulatorOptions.initialSort;
    if (!initialSortRaw?.length)
      return;
    try {
      const initialSort = initialSortRaw.map((s2) => ({
        column: s2.column ?? s2.field ?? "",
        dir: s2.dir
      }));
      this.log("initialSort provided (for Tabulator)", initialSort);
      table.on("dataLoaded", () => {
        this.log("dataLoaded event — applying initialSort", initialSort);
        try {
          table.setSort(initialSort);
        } catch (error) {
          this.log("setSort on dataLoaded failed:", ErrorHelper.toErrorString(error));
        }
        table.on("dataSorted", function(sorters, rows2) {
          if (sorters.length === 0)
            return;
          const cleanSorters = sorters.map((s2) => ({
            field: s2.field || s2.column.getField(),
            dir: s2.dir
          }));
          sessionStorage.setItem(
            `${tableName}-sorters`,
            JSON.stringify(cleanSorters)
          );
        });
      });
    } catch (error) {
      this.log(
        "error scheduling initialSort application:",
        ErrorHelper.toErrorString(error)
      );
    }
  }
}
class TabulatorConfigService {
  createTabulatorConfig(specs, data, schema) {
    const columns = new TabulatorColumnAdapter().convert(
      data.columnConfigs,
      data.columnsAutoShowRemaining,
      schema
    );
    const initialSort = new RadTabSetupSort().loadSortFromSession(specs.tableName) ?? new RadTabColumnSortParser().loadFromSettings(
      schema,
      columns,
      data.columnSort
    );
    return {
      layout: "fitDataFill",
      columns,
      title: data.title || "2sxc Table",
      viewId: data.viewId,
      id: data.id,
      columnConfigs: data.columnConfigs,
      searchEnabled: data.searchEnabled,
      initialSort,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: data.guid
    };
  }
}
class RadTabSetupSearch extends ServiceBase {
  constructor() {
    super({ name: "RadTabSetupSearch", enableDebug: false });
  }
  connectSearch(table, filterName) {
    const filterInput = this.getSearchInput(filterName);
    if (!filterInput) return;
    const onKeyDown = (e) => {
      if (e.key === "Enter") e.preventDefault();
    };
    const onInput = (e) => {
      const value = e.target.value;
      table.setFilter(this.matchAny, { value });
    };
    filterInput.addEventListener("keydown", onKeyDown);
    filterInput.addEventListener("input", onInput);
    this.log("Search input wired", filterName);
  }
  /**
   * Create search input element and place it next to the table heading
   * Uses module ID to ensure targeting the correct instance
   */
  createSearchInput(specs) {
    const searchContainer = document.getElementById(specs.searchContainerDomId);
    if (!searchContainer)
      return;
    const searchInput = document.createElement("input");
    searchInput.className = "form-control";
    searchInput.type = "text";
    searchInput.placeholder = specs.resources.SearchLabel || "Search...";
    searchInput.id = specs.searchDomId;
    searchContainer.appendChild(searchInput);
  }
  /**
   * Custom filter function that matches any field in a row against the search term
   */
  matchAny(data, filterParams, row) {
    const searchEnabled = filterParams.value?.toString().toLowerCase() || "";
    if (!searchEnabled)
      return true;
    if (row?.getCells) {
      for (const cell of row.getCells()) {
        const value = cell.getValue();
        if (value != null && String(value).toLowerCase().includes(searchEnabled))
          return true;
      }
      return false;
    }
    for (const key in data) {
      const value = data[key];
      if (value != null) {
        const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
        if (stringValue.toLowerCase().includes(searchEnabled))
          return true;
      }
    }
    return false;
  }
  /**
   * Get the search input element for Tabulator
   */
  getSearchInput(filterName) {
    const filterInput = document.querySelector(`#${filterName}`);
    if (!filterInput) {
      console.warn(`Search input with ID ${filterName} not found`);
      return;
    }
    return filterInput;
  }
}
class RadTabRegisterSort {
  /**
   * Registers a custom sorter with Tabulator to safely handle object/array values.
   * Uses Tabulator.extendModule (static) to avoid prototype access and keep typings clean.
   */
  registerSortObjectAndArray() {
    try {
      Tabulator$1.extendModule("sort", "sorters", {
        object: function(a, b) {
          const normalize = (v) => {
            if (v === null || v === void 0)
              return "";
            if (Array.isArray(v)) {
              if (v.length === 0)
                return "";
              const first = v[0];
              return first?.Title ?? first?.title ?? String(first);
            }
            if (typeof v === "object") {
              const o = v;
              return o?.Title ?? o?.title ?? JSON.stringify(o);
            }
            return String(v);
          };
          const va = normalize(a);
          const vb = normalize(b);
          if (va === vb)
            return 0;
          return va.localeCompare(vb, void 0, { sensitivity: "base" }) < 0 ? -1 : 1;
        }
      });
    } catch (err) {
      console.warn("Failed to register custom object sorter", err);
    }
  }
}
function cleanupToolbars() {
  document.querySelectorAll(".toolbar-menu").forEach((el) => el.remove());
}
function createVirtualElFromRects(x, y) {
  return {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x,
        y,
        top: y,
        left: x,
        right: x,
        bottom: y
      };
    }
  };
}
function positionToolbarElement(virtualEl, toolbarEl, middlewareOffsetFn = () => 0) {
  const rect = virtualEl.getBoundingClientRect();
  const offsetValue = middlewareOffsetFn();
  toolbarEl.style.position = "fixed";
  const left = rect.left + offsetValue;
  const toolbarHeight = toolbarEl.getBoundingClientRect().height || toolbarEl.offsetHeight || 0;
  const top = rect.top - toolbarHeight / 2;
  const appliedLeft = Math.round(left);
  const appliedTop = Math.round(top);
  toolbarEl.style.left = `${appliedLeft}px`;
  toolbarEl.style.top = `${appliedTop}px`;
  return Promise.resolve({ x: appliedLeft, y: appliedTop });
}
function createRowActionToolbar(table, row, event, showEdit, showDelete, baseButtonSize, zIndex, log) {
  event.preventDefault();
  cleanupToolbars();
  log("Creating row action toolbar", { showEdit, showDelete });
  const sxc = $2sxc(table.element);
  if (!sxc.isEditMode()) {
    log("Not in edit mode, skipping toolbar");
    return;
  }
  const data = row.getData();
  const entityId = data.EntityId ?? data.id;
  const entityGuid = data.EntityGuid ?? data.guid;
  const entityTitle = data.title ?? "";
  log("Entity identifiers for toolbar", { entityId, entityGuid, entityTitle });
  if (!entityId) {
    log("No entityId found for toolbar");
    return;
  }
  const tableRect = table.element.getBoundingClientRect();
  const rowRect = row.getElement().getBoundingClientRect();
  const virtualEl = createVirtualElFromRects(
    tableRect.right,
    rowRect.top + rowRect.height / 2
  );
  const toolbarEl = document.createElement("div");
  toolbarEl.className = "toolbar-menu";
  Object.assign(toolbarEl.style, {
    position: "absolute",
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    zIndex: String(zIndex),
    pointerEvents: "auto"
  });
  const actions = [];
  if (showEdit) {
    actions.push({
      entityId,
      action: "edit",
      ...entityGuid && { entityGuid }
    });
  }
  const canRequestDelete = !!entityId && !!entityGuid && !!entityTitle;
  if (showDelete) {
    if (canRequestDelete) {
      actions.push({
        entityId,
        action: "delete",
        ...entityGuid && { entityGuid },
        entityTitle
      });
    } else {
      log(
        "Skipping server delete toolbar request because entityTitle/entityGuid missing or empty. Will not request native delete button.",
        { entityTitle, entityGuid }
      );
    }
  }
  if (actions.length === 0) {
    log("No actions to show in row action menu");
    return;
  }
  const toolbarHtml = sxc.manage.getToolbar(actions);
  log("Generated toolbar HTML:", toolbarHtml);
  toolbarEl.innerHTML = toolbarHtml;
  if (showDelete) {
    const hasDelete = toolbarEl.querySelector && !!toolbarEl.querySelector('a[onclick*="delete"]');
    log("Server returned delete button present:", hasDelete);
  }
  document.body.appendChild(toolbarEl);
  log("Row action toolbar appended");
  const middlewareOffsetFn = () => -((showDelete ? baseButtonSize : 0) + (showEdit ? baseButtonSize : 0) + (showDelete && showEdit ? 16 : 12));
  positionToolbarElement(virtualEl, toolbarEl, middlewareOffsetFn).then(
    ({ x, y }) => {
      log("Computed toolbar position", { x, y });
    }
  );
  let isHovered = false;
  toolbarEl.addEventListener("mouseenter", () => {
    isHovered = true;
    log("Toolbar hover start");
  });
  toolbarEl.addEventListener("mouseleave", () => {
    isHovered = false;
    log("Toolbar hover end — removing");
    toolbarEl.remove();
  });
  table.on("rowMouseLeave", () => {
    setTimeout(() => {
      if (!isHovered) {
        log("Row mouse leave — removing toolbar");
        toolbarEl.remove();
      }
    }, 100);
  });
}
function showColumnToolbar(column, event, tableConfigData, baseButtonSize, zIndex, log) {
  event.preventDefault();
  log("Creating column toolbar");
  cleanupToolbars();
  const table = column.getTable();
  const sxc = $2sxc(table.element);
  if (!sxc.isEditMode()) {
    log("Not in edit mode, skipping column toolbar");
    return;
  }
  const colEl = column.getElement();
  const colRect = colEl.getBoundingClientRect();
  log("Column rect", colRect);
  const virtualEl = createVirtualElFromRects(
    colRect.right,
    colRect.top + colRect.height / 2
  );
  const toolbarEl = document.createElement("div");
  toolbarEl.className = "toolbar-menu";
  Object.assign(toolbarEl.style, {
    position: "absolute",
    width: `${baseButtonSize}px`,
    height: `${baseButtonSize}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: String(zIndex),
    pointerEvents: "auto"
  });
  toolbarEl.innerHTML = getToolbar(sxc, column, tableConfigData);
  document.body.appendChild(toolbarEl);
  positionToolbarElement(virtualEl, toolbarEl, () => -baseButtonSize).then(({ x, y }) => log("Computed column toolbar position", { x, y }));
  let isHovered = false;
  toolbarEl.addEventListener("mouseenter", () => {
    isHovered = true;
    log("Column toolbar hover start");
  });
  toolbarEl.addEventListener("mouseleave", () => {
    isHovered = false;
    log("Column toolbar hover end — removing");
    toolbarEl.remove();
  });
  table.on("headerMouseLeave", () => {
    setTimeout(() => {
      if (!isHovered) {
        log("Header mouse leave — removing column toolbar");
        toolbarEl.remove();
      }
    }, 100);
  });
}
function getToolbar(sxc, column, tableConfigData) {
  const configuredColumns = Array.isArray(tableConfigData.columnConfigs) ? tableConfigData.columnConfigs : [];
  const colDef = column.getDefinition() || {};
  const colField = (column.getField && column.getField()) ?? "";
  const colTitle = (colDef.title ?? colField) || "";
  const colConfig = configuredColumns.find((cfg) => {
    const cfgTitle = String(cfg.Title ?? cfg.title ?? "");
    return cfgTitle === colTitle || cfgTitle === colField;
  });
  const alreadyConfigured = !!colConfig;
  const entityId = colConfig ? colConfig.id : 0;
  let toolbarHtml;
  if (alreadyConfigured) {
    toolbarHtml = sxc.manage.getToolbar({
      entityId,
      action: "edit"
    });
  } else {
    const fieldValue = colField && colField.trim() !== "" ? colField : colTitle.replace(/\s+/g, "");
    toolbarHtml = sxc.manage.getToolbar({
      contentType: "f58eaa8e-88c0-403a-a996-9afc01ec14be",
      action: "new",
      prefill: {
        Title: colTitle,
        linkEnable: false,
        tooltipEnabled: false,
        FieldValue: fieldValue
      },
      fields: "ColumnConfigs",
      parent: tableConfigData.guid
    });
  }
  return toolbarHtml;
}
function showAddButton(table, tableConfigData, baseButtonSize, zIndex, log) {
  log("Adding add button to table");
  const tableElement = table.element;
  tableElement.querySelectorAll(".table-add-button").forEach((n2) => n2.remove());
  const sxc = $2sxc(tableElement);
  if (!sxc.isEditMode()) {
    log("Not in edit mode, skipping add button");
    return;
  }
  const contentType = tableConfigData.dataContentType || "Default";
  const toolbarHtml = sxc.manage.getToolbar({
    contentType,
    action: "new",
    prefill: {}
  });
  const container = document.createElement("div");
  container.className = "table-add-button";
  Object.assign(container.style, {
    position: "absolute",
    top: "7.5px",
    right: "10px",
    zIndex: String(zIndex - 900),
    width: `${baseButtonSize}px`,
    height: `${baseButtonSize}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });
  container.innerHTML = toolbarHtml;
  tableElement.appendChild(container);
}
class TabulatorToolbars extends ServiceBase {
  constructor() {
    super({ name: "TabulatorToolbars", enableDebug: false });
    this.baseButtonSize = 32;
    this.zIndex = 1e3;
  }
  showAddButton(table, tableConfigData) {
    showAddButton(
      table,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a) => this.log(...a)
    );
  }
  createRowActioToolbar(table, row, event, showEdit, showDelete) {
    createRowActionToolbar(
      table,
      row,
      event,
      showEdit,
      showDelete,
      this.baseButtonSize,
      this.zIndex,
      (...a) => this.log(...a)
    );
  }
  showEditDeleteToolbar(table, row, event) {
    this.createRowActioToolbar(table, row, event, true, true);
  }
  showEditOnlyToolbar(table, row, event) {
    this.createRowActioToolbar(table, row, event, true, false);
  }
  showDeleteOnlyToolbar(table, row, event) {
    this.createRowActioToolbar(table, row, event, false, true);
  }
  showColumnToolbar(column, event, tableConfigData) {
    showColumnToolbar(
      column,
      event,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a) => this.log(...a)
    );
  }
}
class RadTabSetupEditActions extends ServiceBase {
  constructor() {
    super({ name: "RadTabSetupEditActions", enableDebug: false });
    this.tabulatorToolbars = new TabulatorToolbars();
  }
  setupEditAddDelete(table, tableConfigData, specs) {
    if (this.#isViewConfigMode() && specs.canEditConfig) {
      this.log("in ViewConfigMode, setting up header handlers");
      this.#setupViewConfigMode(table, tableConfigData);
    } else if (specs.canEditData) {
      const editEnabled = !!tableConfigData.enableEdit;
      const canDelete = !!tableConfigData.enableDelete;
      this.log("row actions", { editEnabled, canDelete });
      if (editEnabled || canDelete) {
        this.#setupRowActionsHover(table, editEnabled, canDelete);
      }
      if (tableConfigData.enableAdd) {
        this.log("enabling row add mode");
        this.#setupRowAddMode(table, tableConfigData);
      }
    }
  }
  #isViewConfigMode() {
    const url = window.location.href.toLowerCase();
    const qp = new URLSearchParams(window.location.search).get("viewconfigmode")?.toLowerCase();
    return qp === "true" || url.includes("viewconfigmode/true");
  }
  #setupViewConfigMode(table, tableConfigData) {
    this.log("setupViewConfigMode called");
    table.on("dataLoaded", () => {
      this.log("dataLoaded → attaching headerMouseEnter");
      table.on(
        "headerMouseEnter",
        (e, column) => {
          this.log("headerMouseEnter triggered", column);
          this.tabulatorToolbars.showColumnToolbar(column, e, tableConfigData);
        }
      );
    });
  }
  #setupRowActionsHover(table, enableEdit, enableDelete) {
    this.log("setupRowActionsHover called", { enableEdit, enableDelete });
    try {
      table.off?.("rowMouseEnter");
    } catch (error) {
      console.error(
        "Failed to unbind rowMouseEnter",
        ErrorHelper.toErrorString(error)
      );
    }
    table.on("rowMouseEnter", (e, row) => {
      this.log("rowMouseEnter triggered", row.getData());
      if (enableEdit && enableDelete) {
        this.tabulatorToolbars.showEditDeleteToolbar(table, row, e);
      } else if (enableEdit) {
        this.tabulatorToolbars.showEditOnlyToolbar(table, row, e);
      } else if (enableDelete) {
        this.tabulatorToolbars.showDeleteOnlyToolbar(table, row, e);
      }
    });
    table.on("rowMouseLeave", (e, row) => {
      this.log("rowMouseLeave triggered", row.getData());
    });
  }
  #setupRowAddMode(table, tableConfigData) {
    this.log("setupRowAddMode called");
    table.on("dataLoaded", () => {
      this.log("dataLoaded → showing add button");
      this.tabulatorToolbars.showAddButton(table, tableConfigData);
    });
    try {
      this.log("trying to show add button immediately");
      this.tabulatorToolbars.showAddButton(table, tableConfigData);
    } catch (error) {
      this.log(
        "immediate add button failed",
        ErrorHelper.toErrorString(error)
      );
    }
  }
}
Tabulator$1.registerModule([
  Tooltip,
  Format,
  Page,
  Interaction,
  Filter,
  Ajax,
  Sort
]);
class TabulatorAdapter extends ServiceBase {
  constructor() {
    super({ name: "TabulatorAdapter", enableDebug: false });
    this.configService = new TabulatorConfigService();
  }
  async createTable(specs, services, tableConfigData) {
    const tableName = specs.tableName;
    try {
      this.log("createTable called", { tableName, tableConfigData });
      const tabulatorConfig = await this.configService.createTabulatorConfig(specs, tableConfigData, services.schema);
      this.log("tabulatorConfig created", tabulatorConfig);
      const dataProvider = services.dataProvider;
      const ajaxOptions = {
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: {
          method: "GET",
          headers: dataProvider.getHeaders()
        },
        ajaxResponse: (_url, _params, response) => dataProvider.processData(response)
      };
      const tabulatorOptionsRaw = {
        columnDefaults: {
          maxWidth: 300
        },
        ...ajaxOptions,
        ...tabulatorConfig,
        dependencies: {
          // include Luxon DateTime for use in formatters and other custom functions
          // see https://tabulator.info/docs/6.3/dependencies#luxon
          DateTime
        }
      };
      this.log("tabulatorOptionsRaw", tabulatorOptionsRaw);
      const tabulatorOptions = services.customizeManager.customizeTabulator(
        tabulatorOptionsRaw,
        tableConfigData.guid
      );
      this.log("tabulatorOptions after customization", tabulatorOptions);
      new RadTabRegisterSort().registerSortObjectAndArray();
      const table = new Tabulator$1(`#${tableName}`, tabulatorOptions);
      this.log("Tabulator instance created", table);
      new RadTabSetupSort().setupInitialSort(table, tabulatorOptions, tableName);
      if (specs.searchDomId && tableConfigData.searchEnabled) {
        this.log("setting up filter input", specs.searchDomId);
        new RadTabSetupSearch().connectSearch(table, specs.searchDomId);
      }
      new RadTabSetupEditActions().setupEditAddDelete(table, tableConfigData, specs);
      return table;
    } catch (error) {
      console.error(
        "Failed to create Tabulator table:",
        ErrorHelper.toErrorString(error)
      );
      throw error;
    }
  }
}
class CustomizerLoader extends ServiceBase {
  constructor(manager) {
    super({ name: "CustomizerLoader", enableDebug: false });
    this.manager = manager;
  }
  // TODO: Move to another class, as soon as we can test it!
  async load(customizerDistPath) {
    if (!customizerDistPath) {
      this.log("No customizerDistPath provided, skipping customizer loading");
      return;
    }
    this.log("Using app URL for customizers:", customizerDistPath);
    const timestamp = (/* @__PURE__ */ new Date()).getTime();
    const distPath = `${customizerDistPath}?v=${timestamp}`;
    this.log("Attempting to load customizers from:", distPath);
    try {
      const preloadLink = document.createElement("link");
      preloadLink.rel = "modulepreload";
      preloadLink.href = distPath;
      document.head.appendChild(preloadLink);
      const importResult = await import(
        /* webpackIgnore: true */
        distPath
      );
      this.log("Import successful, module keys:", Object.keys(importResult));
      this.log("Module content:", importResult);
      if (importResult && Array.isArray(importResult.customizers)) {
        const customizerClasses = importResult.customizers;
        const customizerInstances = customizerClasses.map((CustomizerClass) => {
          try {
            const instance = new CustomizerClass();
            this.log(`Instantiated customizer: ${instance.constructor.name}`);
            return instance;
          } catch (error) {
            this.log(`Error instantiating customizer:`, error);
            return null;
          }
        }).filter(Boolean);
        if (customizerInstances.length) {
          this.log(`Registering ${customizerInstances.length} user customizers`);
          this.manager.registerCustomizers(customizerInstances);
          this.log(`Customizers registered successfully`);
        }
      } else {
        this.log("No valid customizers array found in imported module");
        this.log("Available exports:", Object.keys(importResult));
      }
    } catch (error) {
      this.log(
        `Error during dynamic import:`,
        ErrorHelper.toErrorString(error)
      );
    }
  }
}
class CustomizeManager extends ServiceBase {
  constructor() {
    super({ name: "CustomizeManager", enableDebug: false });
    this.customizers = [];
    this.activeCustomizers = /* @__PURE__ */ new Map();
    this.registeredIds = /* @__PURE__ */ new Set();
    this._instanceId = Math.random().toString(36).slice(2, 9);
    this.log(`CustomizeManager initialized with instance ID: ${this._instanceId}`);
  }
  /**
   * Get the singleton instance of the CustomizeManager.
   * This is a plain static singleton (does not use window).
   */
  static getInstance() {
    if (!CustomizeManager.instance)
      CustomizeManager.instance = new CustomizeManager();
    return CustomizeManager.instance;
  }
  // #endregion
  async load(customizerDistPath) {
    return new CustomizerLoader(this).load(customizerDistPath);
  }
  /**
   * Register a customizer with the manager. Will dedupe by constructor name by default.
   * If you need a different dedupe key, customizers can expose an `id` string property.
   */
  registerCustomizer(customizer) {
    try {
      const id = customizer.id ?? customizer.constructor?.name ?? String(this.customizers.length);
      this.log(`Attempting to register customizer with ID: ${id}`);
      if (this.registeredIds.has(id)) {
        this.log(`Customizer with ID ${id} already registered - ignoring duplicate`);
        return;
      }
      this.registeredIds.add(id);
      this.customizers.push(customizer);
      this.log(`Successfully registered customizer: ${id}`);
      this.log(`Total registered customizers: ${this.customizers.length}`);
    } catch (err) {
      this.log(`Error registering customizer:`, err);
      console.error("[CustomizeManager] registerCustomizer error:", err);
    }
  }
  registerCustomizers(customizers) {
    this.log(`Registering ${customizers.length} customizers`);
    customizers.forEach((c) => this.registerCustomizer(c));
  }
  getRegisteredCustomizers() {
    this.log(`Getting all registered customizers: ${this.customizers.length} total`);
    return [...this.customizers];
  }
  /**
   * Apply customizations to the table configuration
   * @param config The original table configuration
   * @returns The modified table configuration
   */
  customizeConfig(config) {
    this.log(`Customizing config for table: ${config.title} (GUID: ${config.guid})`);
    if (this.activeCustomizers.has(config.guid)) {
      this.log(`Clearing previous active customizers for ${config.guid}`);
      this.activeCustomizers.delete(config.guid);
    }
    let modifiedConfig = { ...config };
    const activeCustomizersForThisTable = [];
    this.log(`Checking ${this.customizers.length} registered customizers for applicability`);
    for (const customizer of this.customizers) {
      const customizerName = customizer.constructor?.name || "Unknown";
      let shouldApply = false;
      try {
        shouldApply = customizer.shouldApply(config);
        this.log(`Customizer ${customizerName} shouldApply: ${shouldApply}`);
      } catch (err) {
        this.log(`Error in shouldApply of ${customizerName}:`, err);
        console.error(`[CustomizeManager] Error in shouldApply of ${customizerName}:`, err);
      }
      if (shouldApply) {
        this.log(`Adding ${customizerName} to active customizers for this table`);
        activeCustomizersForThisTable.push(customizer);
        try {
          this.log(`Applying ${customizerName} to config`);
          const configBefore = JSON.stringify(modifiedConfig);
          modifiedConfig = customizer.customizeConfig(modifiedConfig);
          const configChanged = configBefore !== JSON.stringify(modifiedConfig);
          this.log(`Config modified by ${customizerName}: ${configChanged}`);
        } catch (err) {
          this.log(`Error in customizeConfig of ${customizerName}:`, err);
          console.error(`[CustomizeManager] Error in customizeConfig of ${customizerName}:`, err);
        }
      }
    }
    if (activeCustomizersForThisTable.length > 0) {
      this.log(`Storing ${activeCustomizersForThisTable.length} active customizers for table ${config.guid}`);
      this.activeCustomizers.set(config.guid, activeCustomizersForThisTable);
    } else {
      this.log(`No active customizers for table ${config.guid}`);
    }
    return modifiedConfig;
  }
  /**
   * Apply customizations to the Tabulator options
   * @param options The original Tabulator options
   * @param configGuid The GUID of the table configuration
   * @returns The modified Tabulator options
   */
  customizeTabulator(options, configGuid) {
    const guid = String(configGuid);
    this.log(`Customizing Tabulator options for table ${guid}`);
    let modifiedOptions = { ...options };
    const customizersForThisTable = this.activeCustomizers.get(guid) || [];
    this.log(`Found ${customizersForThisTable.length} active customizers for table ${guid}`);
    for (const customizer of customizersForThisTable) {
      const customizerName = customizer.constructor?.name || "Unknown";
      try {
        this.log(`Applying ${customizerName} to Tabulator options`);
        const optionsBefore = JSON.stringify(modifiedOptions);
        modifiedOptions = customizer.customizeTabulator(modifiedOptions);
        try {
          const optionsChanged = optionsBefore !== JSON.stringify(modifiedOptions);
          this.log(`Tabulator options modified by ${customizerName}: ${optionsChanged}`);
        } catch (e) {
          this.log(`Could not compare options changes (likely contains functions): ${e}`);
        }
      } catch (err) {
        this.log(`Error in customizeTabulator of ${customizerName}:`, err);
        console.error(`[CustomizeManager] Error in customizeTabulator of ${customizerName}:`, err);
      }
    }
    this.log(`Final Tabulator options keys:`, Object.keys(modifiedOptions));
    return modifiedOptions;
  }
}
class SchemaLoader {
  constructor(sxc) {
    this.sxc = sxc;
  }
  /**
   * Fetches the schema for a given content type
   * @param viewId The ID of the view
   * @returns A promise that resolves to the schema
   */
  async getSchema(viewId) {
    try {
      return await this.sxc.webApi.fetchJson(
        `app/auto/api/radmin/schema?viewid=${viewId}`
      );
    } catch (error) {
      console.error("Error fetching schema:", error);
      throw error;
    }
  }
}
class DataProviderBase {
  constructor(apiUrl, headers, dataContentType) {
    this.apiUrl = apiUrl;
    this.headers = headers;
    this.dataContentType = dataContentType;
  }
  /**
   * Get the API URL
   */
  getApiUrl() {
    return this.apiUrl;
  }
  /**
   * Get the headers for AJAX requests
   */
  getHeaders() {
    return this.headers;
  }
  /**
   * Get the AJAX configuration
   */
  getAjaxConfig() {
    return {
      method: "GET",
      headers: this.headers
    };
  }
}
class DataProviderEntities extends DataProviderBase {
  constructor(apiUrl, headers, dataContentType) {
    super(apiUrl, headers, dataContentType);
  }
  /**
   * Process raw data without fetching it - can be used by ajaxResponse
   */
  processData(data) {
    if (Array.isArray(data)) {
      return data.map((row) => {
        const newRow = {};
        Object.entries(row).forEach(([key, value]) => {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          newRow[camelKey] = value;
        });
        return newRow;
      });
    }
    return data;
  }
  /**
   * Get initial data for table setup
   */
  async getInitialData() {
    try {
      const response = await fetch(this.apiUrl, this.getAjaxConfig());
      return await response.json();
    } catch (error) {
      console.error("Error fetching initial data:", error);
      return [];
    }
  }
}
class DataProviderQuery extends DataProviderBase {
  constructor(sxc, query, linkParameters) {
    const endpoint = `app/auto/query/${query}/${linkParameters ? `?${linkParameters}` : ""}`;
    const apiUrl = sxc.webApi.url(endpoint);
    super(apiUrl, sxc.webApi.headers("GET"));
    this.sxc = sxc;
    this.query = query;
  }
  /**
   * Override getInitialData to include relationship processing
   */
  async getInitialData() {
    try {
      const data = await this.sxc.webApi.fetchJson(this.apiUrl);
      return this.processQueryData(data, this.query);
    } catch (error) {
      console.error(`Error loading data from query ${this.query}:`, error);
      return [];
    }
  }
  /**
   * Process raw data without fetching it - can be used by ajaxResponse
   */
  processData(data) {
    return this.processQueryData(data, this.query);
  }
  /**
   * Private helper to process query data to handle relationships
   */
  processQueryData(data, queryName) {
    let mainKey = queryName;
    let mainItems = data[mainKey] || data["Default"];
    if (!Array.isArray(mainItems))
      return [];
    const lookupMaps = {};
    Object.keys(data).forEach((key) => {
      if (key === mainKey) return;
      const arr = data[key];
      if (Array.isArray(arr) && arr.length > 0 && arr[0] && Object.prototype.hasOwnProperty.call(arr[0], "Id")) {
        lookupMaps[key] = arr.reduce((map, item) => {
          map[item.Id] = item;
          return map;
        }, {});
      }
    });
    const combined = mainItems.map((item) => {
      const newItem = {};
      Object.keys(item).forEach((field) => {
        let value = item[field];
        if (lookupMaps[field] && Array.isArray(value)) {
          value = value.length > 0 ? lookupMaps[field][value[0].Id] || value[0] : null;
        }
        const camelField = field.charAt(0).toLowerCase() + field.slice(1);
        newItem[camelField] = value;
      });
      return newItem;
    });
    return combined;
  }
}
class DataProviderFactory extends ServiceBase {
  constructor() {
    super({ name: "DataProviderFactory", enableDebug: false });
  }
  getDataProvider(tableConfigData, sxc, linkParameters) {
    const query = tableConfigData.dataQuery;
    this.log("Creating data provider for config. Query:", query, "Link parameters:", linkParameters);
    if (query === "") {
      const apiUrl = sxc.webApi.url(`app/auto/data/${tableConfigData.dataContentType}`);
      const headers = sxc.webApi.headers("GET");
      this.log("Created standard DataProvider");
      return new DataProviderEntities(
        apiUrl,
        headers,
        tableConfigData.dataContentType
      );
    }
    this.log("Created QueryDataProvider");
    return new DataProviderQuery(
      sxc,
      tableConfigData.dataQuery,
      linkParameters
    );
  }
}
class TableServicesBase extends ServiceBase {
  constructor(logEnabled, name, sxc, adapter, schemaProvider, customizeManager) {
    super({ name, enableDebug: logEnabled });
    this.sxc = sxc;
    this.adapter = adapter;
    this.schemaProvider = schemaProvider;
    this.customizeManager = customizeManager;
  }
}
class TableServices extends TableServicesBase {
  constructor(sxc) {
    super(
      false,
      "TableServices",
      sxc,
      new TabulatorAdapter(),
      new SchemaLoader(sxc),
      CustomizeManager.getInstance()
    );
  }
  async getComplete(tableConfigData, viewId, linkParameters) {
    const dataProvider = new DataProviderFactory().getDataProvider(tableConfigData, this.sxc, linkParameters);
    const schema = await this.loadSchema(this.schemaProvider, viewId);
    return new TableServicesComplete(this, dataProvider, schema);
  }
  async loadSchema(schemaProvider, viewId) {
    try {
      const schema = await schemaProvider.getSchema(viewId);
      this.log("schema loaded", schema);
      if (!schema || !schema.properties) {
        throw new Error("Invalid schema: missing properties");
      }
      return schema;
    } catch (error) {
      const errStr = ErrorHelper.toErrorString(error);
      this.log("Error loading schema:", errStr);
      throw new Error(`Schema loading failed: ${errStr}`);
    }
  }
}
class TableServicesComplete extends TableServicesBase {
  constructor(services, dataProvider, schema) {
    super(
      true,
      "TableServicesComplete",
      services.sxc,
      services.adapter,
      services.schemaProvider,
      services.customizeManager
    );
    this.dataProvider = dataProvider;
    this.schema = schema;
  }
}
class TableViewConfigurationLoader {
  constructor(sxc) {
    this.sxc = sxc;
  }
  /**
   * Load the table configuration from the server using the provided viewId.
   */
  async loadConfig(viewId) {
    try {
      return await this.sxc.webApi.fetchJson(
        `app/auto/api/radmin/table?viewId=${viewId}`
      );
    } catch (err) {
      console.error("Error loading table config:", err);
      return {};
    }
  }
}
class RadminMain extends ServiceBase {
  constructor() {
    super({ name: "RadminMain", enableDebug: false });
  }
  /**
   * Create a Tabulator table based on configuration
   *
   * Note: containerId is the table element id (e.g. "radmin-id-123").
   * The ErrorHelper will attempt to render alerts into this element or into
   * the corresponding error container ("radmin-id-error-123").
   */
  async setup(data) {
    this.log("Creating tabulator table with data:", data);
    try {
      const sxc = $2sxc(data.moduleId);
      this.log(`SXC context initialized for moduleId: ${data.moduleId}; viewId: ${data.viewId}`);
      const services = new TableServices(sxc);
      await services.customizeManager.load(data.customizerDistPath);
      let tableConfigDataRaw;
      try {
        tableConfigDataRaw = await new TableViewConfigurationLoader(sxc).loadConfig(data.viewId);
        this.log("Loaded raw table config:", tableConfigDataRaw);
      } catch (error) {
        this.log("Failed to load table configuration:", ErrorHelper.toErrorString(error));
        ErrorHelper.handleLoadConfigError(data.tableName, error);
        return;
      }
      this.log("Applying customizations to config");
      const tableConfigData = services.customizeManager.customizeConfig(tableConfigDataRaw);
      this.log("Config after customization:", tableConfigData);
      const configChanged = JSON.stringify(tableConfigDataRaw) !== JSON.stringify(tableConfigData);
      this.log("Were config customizations applied?", configChanged);
      let linkParameters;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("viewconfigmode")) {
        linkParameters = void 0;
      } else {
        const linkParametersFromParams = urlParams.toString().replace(/(^|&)viewid=[^&]*/g, "").replace(/^&/, "");
        linkParameters = linkParametersFromParams ? linkParametersFromParams : void 0;
      }
      if (tableConfigData.searchEnabled)
        new RadTabSetupSearch().createSearchInput(data);
      const servicesComplete = await services.getComplete(tableConfigData, data.viewId, linkParameters);
      try {
        this.log("Creating table with TabulatorAdapter.createTable");
        await new TabulatorAdapter().createTable(
          data,
          servicesComplete,
          tableConfigData
        );
        this.log("Table creation complete");
      } catch (error) {
        this.log("Error creating table:", ErrorHelper.toErrorString(error));
        ErrorHelper.handleCreateTableError(data.tableName, error);
      }
    } catch (error) {
      this.log("Unhandled error in setupTable:", ErrorHelper.toErrorString(error));
      ErrorHelper.showAlert(
        data.tableName,
        "Unexpected Error",
        "An unexpected error occurred while creating the table. Please check the browser console for details."
      );
    }
  }
}
const win = window;
win.radmin ??= new RadminMain();
console.log("2dm radmin version 0.4.xx");
//# sourceMappingURL=tables.js.map
