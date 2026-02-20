module.exports = {
    apps: [
        {
            name: 'ukusiruby-backend',
            script: 'dist/main.js',
            cwd: '/var/www/ukusiruby/back-end',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                DB_USERNAME: 'ukusi_user',
                DB_PASSWORD: 'secure_password_here', // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ ПАРОЛЬ
                DB_NAME: 'ukusiruby_db',
                JWT_SECRET: 'production_secret_key_change_me',
            },
        },
    ],
};
