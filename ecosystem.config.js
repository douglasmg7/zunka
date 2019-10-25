module.exports = {
    apps : [{
        name: 'zunka_site',
        script: './bin/www',
        watch: false,
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            DB: 'production'
        },
        output: '/dev/null',
        error: process.env.ZUNKAPATH + '/log/pm2_zunkasite.log',
        log: '/dev/null',
        // log_type: "json",
        // log: './log/pm2_combined.out_err.log',
    },
    {
        name: 'zunka_srv',
        script: 'zunkasrv',
        cwd: process.env.GS + '/zunkasrv',
        watch: false,
        env: {},
        env_production: {},
        output: '/dev/null',
        error: process.env.ZUNKAPATH + '/log/pm2_zunkasrv.log',
        log: '/dev/null',
    }]
};
