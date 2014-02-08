exports.statusCodes = {
    200 : 'OK',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    500 : 'Internal Server Error',    
    
    // Default value
    def : 'Unknown status'
};

// Convert error codes to error message that will be sent to the client upon an error.
exports.errorMessagesMap = {
    404 :   "Error 404 : Not found",
    405 :   "Error 405 : Method Not Allowed",
    500 :   "Error 500 : The request that has been received is not an Http request",
    
    def :   "Error 500 : Undefined error"
};

// Convert file extenstions to content type. This map is used for determining
// the content type of an Http response.
exports.fileExtensionsToContentType = {
    js         :    "application/javascript",
    json       :    "application/json",
    urlencoded :    "application/x-www-form-urlencoded",
    txt        :    "text/plain",
    html       :    "text/html",
    css        :    "text/css",
    jpeg       :    "image/jpeg",
    jpg        :    "image/jpeg",
    gif        :    "image/gif",
    png        :    "image/png",
    
    // For any file extenstion that is not mentioned above, we return it as plain text
    def        :    "text/plain"
};