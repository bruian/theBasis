const srvPath = process.cwd() + '/server/';

const log               = require(srvPath + 'log')(module);
const mongoose          = require(srvPath + 'db/mongoose');
const UserModel         = require(srvPath + 'model/user');
const ClientModel       = require(srvPath + 'model/client');
const AccessTokenModel  = require(srvPath + 'model/accessToken');
const RefreshTokenModel = require(srvPath + 'model/refreshToken');
const faker             = require('Faker');

UserModel.remove({}, (err) => {
    var user = new UserModel({ username: 'Maus', password: "SuperMaus" });
    user.save((err, user) => {
        if (err)  return log.error(err);
        else log.info('New user - %s:%s', user.username, user.password);
    });

    for (let i = 0; i < 4; i++) {
        var user = new UserModel({ username: faker.random.first_name().toLowerCase(), password: faker.Lorem.words(1)[0] });
        user.save((err, user) => {
            if (err) return log.error(err);
            else log.info('New user - %s:%s', user.username, user.password);
        });
    }
});

ClientModel.remove({}, (err) => {
    var client = new ClientModel({ name: 'OurService iOS client v1', clientId: 'mobileV1', clientSecret:'abc123456' });
    client.save((err, client) => {
        if (err) return log.error(err);
        else log.info('New client - %s:%s', client.clientId, client.clientSecret);
    });
});

AccessTokenModel.remove({}, (err) => {
    if (err) return log.error(err);
});

RefreshTokenModel.remove({}, (err) => {
    if (err) return log.error(err);
});

setTimeout(function() {
    mongoose.disconnect();
    log.info('Renew Complete!');
}, 5000);