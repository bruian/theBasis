const express  = require('express');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;

const srvPath = process.cwd() + '/server/';

const db           = require(srvPath + 'db/mongoose');
const log          = require(srvPath + 'log')(module);
const ArticleModel = require(srvPath + 'model/article');

var router = express.Router();

router.get('/', passport.authenticate('bearer', { session: false }), (req, res) => {
    ArticleModel.find((err, articles) => {
        if(!err) {
            return res.json(articles);
        } else {
            res.statusCode = 500;
            log.error('❌  Internal error (%d): %s', res.statusCode, err.message);
            return res.json( {error: 'Database error'} );
        }
    });
});

router.post('/', passport.authenticate('bearer', { session: false }), (req, res) => {
    var article = new ArticleModel({ 
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        images: req.body.images
    });

    article.save((err) => {
        if (!err) {
            log.info('New article created with id: %s', article.id);
            return res.json( { status: 'OK', article:article } );
        } else {
            if (err.name == 'ValidationError') {
                res.statusCode = 400;
                res.json({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.json({ error: 'Database error' });
            }
            
            log.error('❌  Internal error (%d): %s', res.statusCode, err.message);
        }
    });
});

router.get('/:id', passport.authenticate('bearer', { session: false }), (req, res) => {
    ArticleModel.findById(req.params.id, (err, article) => {
        if (!article) {
            res.statusCode = 404;
            log.error('❌  Article with id: %s Not Found', req.params.id);
            return res.json({ error: 'Not found' });
        }
            
        if (!err) {
            return res.json({ status: 'OK', article:article });
        } else {
            res.statusCode = 500;
            log.error('❌  Internal error (%d): %s', res.statusCode, err.message);
            return res.json({ error: 'Database error '});
        }
    });
});

router.put('/:id', passport.authenticate('bearer', { session: false }), (req, res) => {
    ArticleModel.findById(req.params.id, (err, article) => {
        if (!article) {
            res.statusCode = 404;
            log.error('❌  Article with id: %s Not Found', req.params.id);
            return res.json({ error: 'Not found' });
        }

        article.title = req.body.title;
        article.description = req.body.description;
        article.author = req.body.author;
        article.images = req.body.images;
        article.save((err) => {
            if (!err) {
                log.info('Article with id: %s updated', req.params.id);
                return res.json({ status: 'OK', article:article });
            } else {
                if (err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.json({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.json({ error: 'Database error' });
                }
                
                log.error('❌  Internal error (%d): %s', res.statusCode, err.message);
            }
        });
    });
});

router.delete('/:id', passport.authenticate('bearer', { session: false }), (req, res) => {
    ArticleModel.findById(req.params.id, (err, article) => {
        if (!article) {
            res.statusCode = 404;
            log.error('❌  Article with id: %s Not Found', req.params.id);
            return res.json({ error: 'Not found' });
        }

        article.remove((err) => {
            if (!err) {
                log.info('Article with id: %s removed', req.param.id);
                return res.json({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('❌  Internal error (%d): %s', res.statusCode, err.message);
                return res.json({ error: 'Database error' });
            }
        });
    });
});

module.exports = router;