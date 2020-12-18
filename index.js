//Load express module with `require` directive
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/user')

const port = process.env.PORT || 8081;

const db_link = "mongodb://mongo:27017/userscruddb";

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

mongoose.connect(db_link, options).then(function () {
    console.log('MongoDB is connected');
})
    .catch(function (err) {
        console.log(err);
    });
//Body read n parse
app.use(express.json());


const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "UsersCRUD API",
            description: "Users CRUD Class",
            contact: {
                name: "mateocm96"
            },
            servers: ["http://localhost:8081"]
        }
    },
    apis: ["index.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//Define request response in root URL (/)
app.get('/', function (req, res) {
    res.send('Users CRUD');
})

/**
 * @swagger
 * /users:
 *  get:
 *      description: Use to request all users
 *      responses:
 *          '200':
 *              description: A successful response
 */
app.get('/users', async function (req, res) {
    const users = await User.find({}, 'name email');
    res.status(200).json({
        ok: true,
        users
    });
})
/**
 * @swagger
 *
 * definitions:
 *   User:
 *     type: object
 *     required:
 *       - name
 *       - password
 *       - email
 *     properties:
 *       name:
 *         type: string
 *       password:
 *         type: string
 *         format: password
 *       email:
 *         type: string
 */

/**
 * @swagger
 * /users:
 *  post:
 *      description: Use to create an user
 *      parameters:
 *        - name: user
 *          in: body
 *          description: User object
 *          required: true
 *          schema:
 *              $ref: '#/definitions/User'
 *      responses:
 *          '201':
 *              description: Successfully created
 *          '400':
 *              description: Email already registered
 *          '500':
 *              description: Unexpected error
 */
app.post('/users', async function (req, res) {
    const email = req.body.email;
    try {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({
                ok: false,
                msg: 'Email already registered'
            });
        }
        const user = new User(req.body);
        await user.save();
        res.status(201).json({
            ok: true,
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Unexpected error'
        });
    }
})

/**
 * @swagger
 * /users/{id}:
 *  put:
 *      description: Use to update an user
 *      parameters:
 *        - name: id
 *          in: path
 *          description: User id
 *          required: true
 *          type: string
 *        - name: user
 *          in: body
 *          description: User object
 *          required: true
 *          schema:
 *              $ref: '#/definitions/User'
 *      responses:
 *          '201':
 *              description: Successfully updated
 *          '400':
 *              description: Email already registered
 *          '500':
 *              description: Unexpected error
 */
app.put('/users/:id', async function (req, res) {
    const uid = req.params.id;
    try {
        const DBUser = await User.findById(uid);
        if (!DBUser) {
            return res.status(400).json({
                ok: false,
                msg: 'User not found'
            });
        }
        const fields = req.body;

        if (DBUser.email === req.body.email) {
            delete fields.email;
        } else {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Email already registered'
                });
            }
        }
        const updatedUser = await User.findByIdAndUpdate(uid, fields, {new: true});
        res.status(201).json({
            ok: true,
            user: updatedUser
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Unexpected error'
        });
    }
})

/**
 * @swagger
 * /users/{id}:
 *  delete:
 *      description: Use to delete an user
 *      parameters:
 *        - name: id
 *          in: path
 *          description: User id
 *          required: true
 *          type: string
 *      responses:
 *          '200':
 *              description: Successfully deleted
 *          '400':
 *              description: User not found
 *          '500':
 *              description: Unexpected error
 */
app.delete('/users/:id', async function (req, res) {
    const uid = req.params.id;
    try {
        const DBUser = await User.findById(uid);
        if (!DBUser) {
            return res.status(400).json({
                ok: false,
                msg: 'User not found'
            });
        }
        await User.findByIdAndDelete(uid);
        res.status(200).json({
            ok: true,
            msg: 'Successfully deleted'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Unexpected error'
        });
    }
})

//Launch listening server on port 8081
app.listen(port, function () {
    console.log('app listening on port 8081!')
})