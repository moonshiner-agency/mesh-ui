import { by, element } from 'protractor';

export class NodeBrowserDialog {
    private readonly nodeBrowser = element(by.css('mesh-node-browser'));

    public getBreadcrumbLinks() {
        return this.nodeBrowser.all(by.css('gtx-breadcrumbs a.breadcrumb'));
    }

    public getNodes() {
        return this.nodeBrowser.all(by.tagName('gtx-contents-list-item'));
    }

    public getPages() {
        return this.nodeBrowser.all(by.css('pagination-controls li:not(.pagination-previous):not(.pagination-next)'));
    }

    public choose() {
        return this.nodeBrowser.element(by.css('button.primary')).click();
    }
}