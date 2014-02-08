function ClientRequest(socket) {
    this.socket = socket;
    this.httpVersion = null;
    this.headers = {};
    this.method = null;
    this.url = null;
    this.body = null;
}

module.exports = ClientRequest;