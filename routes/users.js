const express = require('express')
const router = express.Router()
const mysql = require('../mysql').poolUsers
const Password = require('node-php-password');
const jwt = require('jsonwebtoken')
const SECRET = process.env.PASSWORD


function verifyJWT(req, res, next) {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET, (error, decoded) => {
        if (error) return res.status(401).send({ error: error })
        req.userName = decoded.userName
        next()
    })
}


router.get('/', verifyJWT, (req, res, next) => {
    console.log(req.userName + 'fez a chamada')
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            'SELECT * FROM members',
            (error, result, field) => {
                conn.release()
                if (error) { return res.status(500).send({ error: error }) }

                const response = {
                    quantity: result.length,
                    users: result.map(user => {
                        return {
                            id: user.id,
                            username: user.username,
                            cidade: user.cidade,
                            password: user.password,
                            request: {
                                type: 'GET',
                                description: 'Return All Users',
                                url: `http://localhost:3000/users/${user.id}`,
                            }
                        }
                    })
                }
                return res.status(200).send({ response })
            }
        )
    })
})

router.post('/', verifyJWT, (req, res, next) => {

    const user = {
        username: req.body.username,
        password: Password.hash(req.body.password),
        email: 'email',
        verified: 1,
        cidade: req.body.cidade,
    }
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            'INSERT INTO members (username,password,email,verified,cidade) VALUES(?,?,?,?,?)',
            [user.username, user.password, user.email, user.verified, user.cidade],
            (error, result, field) => {
                conn.release()
                if (error) { return res.status(500).send({ error: error }) }
                res.status(201).send({
                    message: 'New User Created:',
                    id: result.insertId,
                    addedUser: user
                })
            }
        )
    })


})

router.post('/login', (req, res) => {
    if (req.body.password === SECRET) {
        const token = jwt.sign({ userName: 'Neo' }, SECRET)
        return res.json({ auth: true, token });
    }
    res.status(401).end()
})

router.post('/logout', (req, res) => {
    res.end()
})


router.get('/:user_id', verifyJWT, (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            'SELECT * FROM members WHERE id = ?;',
            [req.params.user_id],
            (error, result, field) => {
                conn.release()
                if (error) { return res.status(500).send({ error: error }) }

                if (result.length == 0) {
                    return res.status(404).send({
                        message: 'ID Not found'
                    })
                }

                const response = {

                    user: {
                        id: result[0].user_id,
                        username: result[0].username,
                        password: result[0].password,
                        cidade: result[0].cidade,
                        request: {
                            type: 'GET',
                            description: 'Return a User',
                            url: `http://localhost:3000/users/`,
                        }

                    }
                }
                return res.status(200).send({ response })
            }
        )
    })
})

router.patch('/', verifyJWT, (req, res, next) => {
    const user = {
        username: req.body.username,
        id: req.body.id
    }
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            `UPDATE members SET username=? WHERE id=?`,
            [user.username, user.id],
            (error, result, field) => {
                conn.release()
                if (error) {
                    return res.status(500).send({ error: error })

                }

                res.status(202).send({
                    message: 'User Modified:',
                    modifiedUser: user
                })
            }
        )
    })
})

router.delete('/:id', verifyJWT, (req, res, next) => {

    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            'DELETE from members WHERE id=?', [req.params.id],
            (error, result, field) => {
                conn.release()
                if (error) { return res.status(500).send({ error: error }) }

                res.status(202).send({
                    message: 'User Deleted:',
                    deletedUser: req.params.id
                })
            }
        )
    })
})


module.exports = router