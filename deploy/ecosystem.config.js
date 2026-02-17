module.exports = {
    apps: [
        {
            name: 'ukusiruby-backend',
            script: 'dist/main.js',
            cwd: '/var/www/ukusiruby/backend',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                // Сюда мы добавим пароли позже
            },
        },
    ],
};
