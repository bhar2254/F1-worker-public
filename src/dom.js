/**
 * dom.js
 * Module for creating UI (Bootstrap 5) applications with Cloudflare Workers
 */

String.prototype.capitalizeFirstChar = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

export class Defaults {
    static defaults = {}
    static setup = (setup) => {
        if (setup.defaults) {
            setDefts(setup.defaults)
        }
    }
    static setDefs = (setDefaults) => {
        for (const [key, value] of Object.entries(setDefaults)) {
            HtmlElement.defaults[key] = value
        }
    }
}

export class HtmlElement extends Defaults {
    constructor(args) {
        super(args)
        this.tag = args.tag || ''
        this.attributes = args.attributes || {}
        this.classes = args.classes || []
        this.content = args.content || ''
        this.parent = args.parent || {}
        this.children = args.children || []
    }
    set attributes(attr) {
        this._attributes = attr
    }
    get attributes() {
        let output = ''
        for (const [key, value] of Object.entries(this._attributes))
            output = ` ${key}='${value}'`
        return output
    }
    set children(children) {
        this._children = children
    }
    get children() {
        return this._children
    }
    set classes(classes) {
        this._classes = Array.isArray(classes) ? classes : []
    }
    get classes() {
        let response = ' '
        for (const each of this._classes)
            response += `${each} `
        return response.trim()
    }
    set content(content) {
        this._content = content
    }
    get content() {
        return this._content
    }
    set parent(parent) {
        this._parent = parent
    }
    get parent() {
        return this._parent
    }
    set tag(tag) {
        const htmlTags = ['!--...--', '!DOCTYPE', 'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'search', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']
        this._tag = htmlTags.includes(tag) ? tag : 'div'
    }
    get tag() {
        return this._tag
    }
    addChild(child) {
        if (!this._children.includes(child))
            this._children.push(child)
    }
    addClass(classString) {
        this._classes.push(classString)
        return this.classes
    }
    renderChildren() {
        let output = ''
        for (const each of this.children)
            output += ` ${each.render()} `
        return output
    }
    render() {
        return `<${this.tag}${this.attributes} class='${this.classes}'>${this.content}</${this.tag}>`
    }
}

export class Card extends HtmlElement {
    constructor(args) {
        super(args)
        this.addClass('card')
        const { header = {}, body = {}, footer = {}, options = {}} = args
        this.header = header
        this.centered = options.centered ? 'text-center' : ''
        this.body = body
        this.footer = footer
        this.content = `
            <div class='card-header ${this.centered ? 'text-center' : ''}'>
                ${this.header}
            </div>
            <div class="card-body">
                ${this.body}
            </div>          
            <div class="card-footer">
                <div class="row ${this.centered ? 'text-center' : ''}">
                    ${this.footer}
                </div>
            </div>`
    }
    set header(header) {
        this._header = String(header)
    }
    get header() {
        return this._header
    }
    set body(body) {
        this._body = String(body)
    }
    get body() {
        return this._body
    }
    set footer(footer) {
        this._footer = String(footer)
    }
    get footer() {
        return this._footer
    }
}

export class FormInput extends HtmlElement {
    static inputGroup = (inputArr) => {

    }
    constructor(args) {
        super(args)
        this.key = args.key || ''
        this.id = args.id || this.key
        this.tag = args.tag || 'input'
        this.type = args.type || 'text'
        this.label = args.label || 'Field'
        this.pattern = args.pattern || ''
        this.options = args.options || []
        this.value = args.value || ''
        this.width = args.width || 'md'
        this.placeholder = args.placeholder || ''
    }
    set key(key) {
        this._key = key
    }
    get key() {
        return this._key
    }
    set label(label) {
        this.formattedLabel = label.trim().capitalizeFirstChar()
        this._label = label
    }
    get label() {
        return this._label
    }
    set tag(tag) {
        const typeList = ['select', 'input', 'textarea']
        const reformattedType = tag.trim().toLowerCase()
        this._tag = typeList.includes(reformattedType) ? tag : 'input'
    }
    get tag() {
        return this._tag
    }
    set type(type) {
        this._type = type
    }
    get type() {
        return this._type
    }
    set width(width) {
        const widths = {
            'xs': 'col-sm-2 col-xs-11',
            'sm': 'col-sm-4 col-xs-11',
            'md': 'col-sm-5 col-xs-11',
            'lg': 'col-11',
        }
        this._width = widths[width] || width || ''
        
    }
    get width() {
        return this._width
    }
    fieldWrapper(args) {
        const _args = { ...args }
        const id = _args.id || 'page_form'
        const content = _args.content || ''
        return `
            <div id='${id}' class='mb-3 mx-auto mb-3 mx-auto ${this.width}'>
                ${content}
            </div>`
    }
    render() {
        const fieldTypes = {
            'select': () => {
                let content = `
                    <label class='border-0' id='${this.key}_label'>${this.label}</label>
                    <select id='${this.key}_field' name='${this.key}' class='form-control border' style='cursor:auto;box-sizing:border-box;height:40.5px' type='select'>`
                if(!Array.isArray(this.options))
                    Object.entries(this.options).forEach(([key, value]) => {
                        const isActive = key == this.value || value == this.value ? ' selected' : ''
                        content += `
                            <option value='${key}'${isActive}>${value}</option>`
                    })  
                if(Array.isArray(this.options))
                    this.options.forEach((each) => {
                        const isActive = each == this.value || each == this.value ? ' selected' : ''
                        content += `
                            <option value='${each}'${isActive}>${each}</option>`
                    })
                content += `
                    </select>`
                return this.fieldWrapper({ id: this.key, content: content })
            },
            'textarea': () => {
                const { id, key, value, label, placeholder = '' } = this
                let content = `
                    <label class='border-0' id='${id}_label'>${label}</label>
                    <textarea style='min-height:7.55rem;' rows='4' id='${id}_field' name='${key}' class='form-control border' placeholder='${placeholder}'>
                        ${value}
                    </textarea>`
                return this.fieldWrapper({ id: id, content: content })
            },
            'input': () => {
                const { id, key, value = '', label, type, placeholder = '', pattern = 0 } = this
                const fullPattern = pattern ? ` pattern=${pattern}` : ``
                let content = `
                    <label class='border-0' id='${id}_label'>${label}</label>
                    <input id='${id}_field' name='${key}' class='form-control border' style='cursor:auto;box-sizing:border-box;height:40.5px' type='${type}' placeholder='${placeholder}' ${fullPattern}'>
                    <script>
                        document.getElementById("${id}_field").value = "${value}";
                    </script>`
                return this.fieldWrapper({ id: id, content: content })
            }
        }
        return fieldTypes[this.tag]()
    }
}

export class Form extends HtmlElement {
    constructor(args) {
        super(args)
        this._args = { ...args }
        this.id = this._args.id || 'page_form'
        this.form_html = ''
        this.field_length = this._args.fields ? this._args.fields.length : 0
        this.method = this._args.method || 'GET'
        this.action = this._args.action || ''
        this.fields = this._args.fields || []
        this.columns = this._args.columns || 2
        delete this._args
    }
    addField = field => {
        return this.fields.push(field)
    }
    render() {
        let form_html = `    
            <form id='${this.id}' class='mx-auto col-lg-9 col-md-11 col-sm-12' action='${this.action}' method='${this.method}'>
                <div class='row'>`
        const additional_fields = {
            'hr': (x) => {
                return `${x.value}<hr>`
            },
            'br': (x) => {
                return `${x.value}<br>`
            }
        }
        for (const each of this.fields) {
            if(Object.keys(additional_fields).includes(each.key)){
                form_html += additional_fields[each.key](each)
                continue
            }
            const formInput = new FormInput(each)
            form_html += formInput.render()
        }
        return this.form_html = form_html + `
                    <button form="${this.id}" type="submit" class="btn bh-primary">Submit</button>
                </div>
            </form>`
    }
}

export class Modal extends HtmlElement {
    constructor(args) {
        super(args)
        this.id = args.id
        this.title = args.title
        this.body = args.body
        this.footer = args.footer || args.buttons || `
                    <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Close</button>
                    <button type='button' class='btn bh-primary'>Save</button>
        `
        this.trigger = {
            style: args.trigger ? args.trigger.style : 'primary',
            text: args.trigger ? args.trigger.text : 'Trigger Modal'
        }
    }
    set title(title) {
        this._title = title.trim().capitalizeFirstChar()
    }
    get title() {
        return this._title
    }
    set body(body) {
        this._body = body.trim().capitalizeFirstChar()
    }
    get body() {
        return this._body
    }
    set footer(footer) {
        this._footer = footer
    }
    get footer() {
        return this._footer
    }
    set trigger(trigger) {
        this._trigger = trigger
    }
    get trigger() {
        return `
        <button type='button' class='btn bh-${this._trigger.style}' data-bs-toggle='modal' data-bs-target='#${this.id}'>
            ${this._trigger.text}
        </button>
        `
    }
    render() {
        return `
        ${this.trigger}
        <div id='${this.id}' class='modal' tabindex='-1'>
            <div class='modal-dialog'>
                <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title'>${this.title}</h5>
                    <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
                </div>
                <div class='modal-body'>
                    <p>${this.body}</p>
                </div>
                <div class='modal-footer'>
                    ${this.footer}
                </div>
                </div>
            </div>
        </div>
        `
    }
}

export class Table extends HtmlElement {
    constructor(args) {
        super(args)
        this.tag = 'table'
        this.classes = ['table','table-striped','table-compact']
        const { data = [{}] } = args
        const content = []
        const includesHeader = args.includesHeader || false
        const header = []
        if (includesHeader){
            Object.values(data[0]).forEach(row => {
                header.push(row)
            })
        } else {
            Object.keys(data[0]).forEach(row => {
                header.push(row)
            })
        }
        content.push('<tr>')
        header.forEach(key => {
            content.push(`
                <th>${ key.replace('_', ' ').replace('-', ' ').capitalizeFirstChar() }</td>
            `)
        })
        content.push('</tr>')
        data.forEach(row => {
            content.push('<tr>')
            header.forEach(key => {
                content.push(`
                    <td>${row[key]}</td>
                `)
            })
            content.push('</tr>')
        })
        this.content = content.join('')
    }
}

export class Page extends Defaults {
    constructor(args) {
        super(args)
        this.siteTitle = args.siteTitle ? args.siteTitle.capitalizeFirstChar() : Page.defaults.siteTitle || 'Default'
        this.pageTitle = args.pageTitle ? args.pageTitle.capitalizeFirstChar() : Page.defaults.pageTitle || 'Page'
        this.style = args.style || ''
        this.header = { headerTitle: `${this.siteTitle} | ${this.pageTitle}`, headerOverwrite: args.headerOverwrite || null }
        this.brand = args.brand || Page.defaults.brand || args.siteTitle
        this.navbar = args.navbar || Page.defaults.navbar || [{}]
        this.body = args.body || Page.defaults.body || 'Bootstrap 5 Starter'
        this.footer = args.footer || Page.defaults.footer || ''
        this.tag = 'html'
    }
    set body(content) {
        const body = `
    <body>
        <div class='main'>
            <div class='mx-auto px-4 my-5 py-3 bh-light-grey shadow-lg bh-left-bar col-lg-9 col-md-12 col-sm-12'>
                ${content}
            </div>
        </div>`
        this.content = body
    }
    get body() {
        return this.content
    }
    set footer(content) {
        this._footer = content
    }
    get footer() {
        return `${this._footer}
    </body>
</html>`
    }
    set header(args) {
        this._headerTitle = args.headerTitle
        if (args.headerOverwrite)
            this._headerOverwrite = args.headerOverwrite
    }
    get header() {
        return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset='utf8' />
                <title>${this._headerTitle}</title>
                <style>${this.style}</style>
                ${this._headerOverwrite || Page.defaults.header}
            </head>`
    }
    set navbar(navbar) {
        this._navbar = navbar
    }
    get navbar() {
        const generateDropdown = (args) => {
            const _args = { ...args }
            const text = _args.text || ''
            const links = _args.links || []
            let responseHtml = `
                <li class='nav-item dropdown'>
                    <a id='navbar_dropdown_item' class='nav-link' href='#' role='button' data-bs-toggle='dropdown' aria-expanded='false'>${text}</a>
                        <ul class='dropdown-menu border shadow-lg'>`
            for (const each of links)
                if (each.text == 'hr')
                    responseHtml += `<hr style='color:#533; margin:0; padding:0;'>`
                else
                    responseHtml += `<li><a class='dropdown-item' target='${each.target || '_self'}' href='${each.link || '#'}'>${each.text || ''}</a></li>`
            return responseHtml + `</ul>
        </li>`
        }
        const dropdowns = this._navbar || [{}]
        let dropDownHtml = ''
        for (const each of dropdowns)
            dropDownHtml += generateDropdown(each)
        return `
            <nav class='navbar navbar-expand-lg bg-primary bg-gradient sticky-top shadow-lg'>
                <div class='col-7 container-fluid'>
                <button class='my-1 navbar-toggler' type='button' data-bs-toggle='collapse' data-bs-target='#navbarSupportedContent' aria-controls='navbarSupportedContent' aria-expanded='false' aria-label='Toggle navigation'><i class='fa-solid fa-bars'></i></button>
                <div class='collapse navbar-collapse' id='navbarSupportedContent'>
                    <a id='navbar_banner_button' class='fs-5 navbar-brand hide-on-shrink' href='/'>${this.brand}</a>
                    <ul class='navbar-nav ms-auto'>
                        ${dropDownHtml}
                    </ul>
                </div>
                </div>
            </nav>`
    }
    set style(style) {
        this._style = style
    }
    get style() {
        return this._style
    }
    render() {
        return this.header + this.navbar + this.body + this.footer
    }
}