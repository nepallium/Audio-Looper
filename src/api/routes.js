import express from 'express'
import getYtAudio from './getYtAudio.js'

const router = express.Router()

router.get('/', getYtAudio)

export default router