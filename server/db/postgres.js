import { Pool } from 'pg';
import configPrivate from '../config-private';

const srvPath = process.cwd() + '/server/';
const log = require(srvPath + 'log')(module);

const pool = new Pool(configPrivate.postgres);

pool.on('error', (err, client) => {
	log.error('⚙️  Postgres database error: %s', err.message);
});

pool.query(
	'select * from pg_stat_database WHERE datname = $1',
	[configPrivate.postgres.database],
	(err, res) => {
		if (err) {
			log.error('⚙️  Postgres database error: %s', err.message);
			throw err;
		}

		log.info(
			'⚙️  Connected to Postgres database! Base have %s connections',
			res.rows[0].numbackends,
		);
	},
);

function prepareParametres(obj, data = undefined) {
	let result = {
			fields: '',
			anchors: '',
			values: [],
			condition: '',
			datastring: '',
		},
		num = 0,
		value,
		operator = '=',
		lBracket,
		rBracket;

	if (data != undefined) {
		for (var element in data) {
			num++;

			result.datastring += `${element} = ${'$' + num}, `;
			result.fields += element + ', ';
			result.anchors += '$' + num + ', ';
			result.values.push(data[element]);
		}
		result.datastring = result.datastring.slice(0, -2);
	}

	for (var prop in obj) {
		num++;
		lBracket = '';
		rBracket = '';

		if (obj[prop] === null) {
			value = obj[prop];
			operator = '=';
		} else if (typeof obj[prop] === 'object' && obj[prop] instanceof Date) {
			value = obj[prop];
			operator = '=';
		} else if (typeof obj[prop] === 'object') {
			value = Object.entries(obj[prop])[0][1];

			switch (Object.entries(obj[prop])[0][0]) {
				case '$gte':
					operator = '>=';
					break;
				case '$gt':
					operator = '>';
					break;
				case '$nin':
					operator = 'NOT IN';
					lBracket = '(';
					rBracket = ')';

					break;
				case '$in':
					operator = 'IN';
					lBracket = '(';
					rBracket = ')';

					break;
				case '$lt':
					operator = '<';
					break;
				case '$lte':
					operator = '<=';
					break;
				case '$ne':
					operator = '!=';
					break;
				case '$eq':
				default:
					operator = '=';
			}
		} else {
			value = obj[prop];
			operator = '=';
		}

		result.condition += `${prop} ${operator} ${lBracket}${'$' + num}${rBracket} AND `;
		result.fields += prop + ', ';
		result.anchors += '$' + num + ', ';
		result.values.push(value);
	}
	result.fields = result.fields.slice(0, -2);
	result.anchors = result.anchors.slice(0, -2);
	result.condition = result.condition.slice(0, -5);

	return result;
}

module.exports = {
	pool,
	prepareParametres,
};
