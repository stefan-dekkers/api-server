// Utils

module.exports = {
    logger: require('tracer').console({
        level: process.env.LOGLEVEL || 'debug',
        format: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})',
        dateformat: 'HH:MM:ss.L',
        preprocess: function (data) {
            data.title = data.title.toUpperCase();
        },
    }),

    jwtSecretKey: process.env.JWT_SECRET || '8beeba3b8eedb3196c52e59920fd8d023ee28669f25371376d5699738c9030ca',
};
