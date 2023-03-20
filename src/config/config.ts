import dotenv from 'dotenv'
dotenv.config()

export default {
    'development': {
        debug: (process.env.DEBUG || 1),
        stage: 'development',
        port: process.env.PORT || 3000,
        secret: process.env.SECRET,
    },
    'production': {
        debug: (process.env.DEBUG || 0),
        stage: 'production',
        port: process.env.PORT || 3000,
        secret: process.env.SECRET,
    },
    'test': {
        debug: (process.env.DEBUG || 0),
        stage: 'test',
        port: process.env.PORT || 3000,
        secret: process.env.SECRET,
    }
}
