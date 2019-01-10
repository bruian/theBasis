/* Create enumeration tables with set initial values
CREATE TABLE enum_creating(id smallint, name varchar(25));
INSERT INTO  enum_creating(id, name) VALUES (0, 'not created'), (1, 'creation by owner'), (2, 'creation by curator'), (3, 'creation by member'), (4, 'creation by all');
CREATE TABLE enum_reading(id smallint, name varchar(25));
INSERT INTO  enum_reading(id, name) VALUES (0, 'not readable'), (1, 'owner reading'), (2, 'curator reading'), (3, 'members reading'), (4, 'reading by all');
CREATE TABLE enum_updating(id smallint, name varchar(25));
INSERT INTO  enum_updating(id, name) VALUES (0, 'not updated'), (1, 'updated by the owner'), (2, 'updated by the curator'), (3, 'updated by the member'), (4, 'updated by all');
CREATE TABLE enum_deleting(id smallint, name varchar(25));
INSERT INTO  enum_deleting(id, name) VALUES (0, 'not deleted'), (1, 'deleting by owner'), (2, 'deleting by curator'), (3, 'deleting by member'), (4, 'deleting by all');
*/
/* Create group type table
CREATE TABLE group_type (id serial, name varchar(20));
INSERT INTO group_type (name) VALUES ('primary'), ('secondary'), ('shared');
*/
/* Create user type table
CREATE TABLE user_type (id serial, name varchar(15));
INSERT INTO user_type (name) VALUES ('owner'), ('curator'), ('member')
*/

/* Create users personality datas
CREATE TABLE users_personality (user_id int, name varchar(150), dateofbirth date, city varchar(150), country varchar(150), phone varchar(40))
*/
/* Create users photo table
CREATE TABLE users_photo (photo_id serial, user_id int, isavatar bool);
*/
/* Create users list
CREATE TABLE users_list (user_id int, friend_id int, visble smallint);
*/

/* Запрос полной информаци по пользователю id = 1, относительно пользователя user_id = 2
   Request complete information on user id = 1, relative to user id = 2
WITH users_table AS (
SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar, 0 as friend FROM users AS usr
	RIGHT JOIN users_personality AS usr_p ON usr.id = usr_p.user_id
	RIGHT JOIN users_photo AS usr_ph ON usr.id = usr_ph.user_id AND usr_ph.isAvatar = true
	WHERE usr.visible = 2 --AND usr.id = 39
UNION
SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar, 1 as friend FROM users_list AS ul
	RIGHT JOIN users AS usr ON ul.friend_id = usr.id AND usr.visible > 0
	RIGHT JOIN users_personality AS usr_p ON ul.friend_id = usr_p.user_id
	RIGHT JOIN users_photo AS usr_ph ON ul.friend_id = usr_ph.user_id AND usr_ph.isAvatar = true
	WHERE ul.visible > 0 AND ul.user_id = 1 --AND ul.friend_id = 39

)
SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, avatar, sum(friend) FROM users_table
GROUP BY id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, avatar
LIMIT 5 OFFSET 0;
*/

/**************** Выборка друзей моего друга
WITH main_ul AS (
	SELECT * FROM users_list AS ul
	WHERE ul.user_id = 1 AND ul.friend_id = 2 AND ul.visible = 2
)
SELECT id, username, name, email, verified, loged, dateofbirth, city, country, gender, phone, url as avatar FROM users_list AS ul
	RIGHT JOIN users AS usr ON ul.friend_id = usr.id AND usr.visible = 1
	RIGHT JOIN users_personality AS usr_p ON ul.friend_id = usr_p.user_id
	RIGHT JOIN users_photo AS usr_ph ON ul.friend_id = usr_ph.user_id AND usr_ph.isAvatar = true
	WHERE ul.visible > 0 AND ul.user_id = 2 AND (SELECT COUNT(user_id) FROM main_ul) > 0;
*/

--INSERT INTO users_list (user_id, friend_id, visible) VALUES (2, 4, 2)
--UPDATE users SET visible = 1 WHERE id = 1
--CREATE TABLE refresh_tokens (value varchar(1024), user_id int, client_id int, scope varchar(10), expiration timestamp)

/****************
INSERT INTO users_personality (user_id, name, dateofbirth, city, country, phone)
	VALUES (1, 'Dergach Виктор', '1984-03-29', 'Krasnoyarsk', 'Russia', '+7 (905) 976-54-53');

INSERT INTO users_photo (user_id, isavatar, url)
	VALUES (1, true, 'https://s3.amazonaws.com/uifaces/faces/twitter/fabbianz/128.jpg');
*/

/****************
DELETE FROM clients;
DELETE FROM users;
DELETE FROM groups;
DELETE FROM groups_list;
SELECT * FROM users;
SELECT * FROM clients;
SELECT * FROM groups;
SELECT * FROM groups_list order by group_id;
SELECT * FROM users_list;
SELECT * FROM users_personality;
SELECT * FROM users_photo ORDER BY user_id;
*/

--UPDATE users_photo SET user_id = 2 WHERE photo_id = 2;

--ALTER TABLE context_list RENAME COLUMN id_user TO id_task;

--CREATE TABLE context (id serial, value varchar(1024));
--CREATE TABLE context_list (id_user int, id_context int);
--CREATE TABLE context_setting (id_context int, id_user int, id_inherited int, active bool, note varchar(2000), activity_type smallint)

/*
INSERT INTO context (value) VALUES ('Китайский язык');
INSERT INTO context_list (id_task, id_context) VALUES (3, 3);
INSERT INTO context_setting (id_context, id_user, id_inherited, active, note, activity_type) VALUES (3, 1, 0, true, 'Изучение языков', 1);
*/

/*
SELECT p.id, p.title,
  SUM(CASE c.status WHEN 1 THEN 1 ELSE 0 END) AS 'Count status 1',
  SUM(CASE c.status WHEN 2 THEN 1 ELSE 0 END) AS 'Count status 2'
  FROM Tags AS p
  LEFT OUTER JOIN Tags AS c
    ON c.parent_id = p.id
  WHERE p.parent_id IS NULL
  GROUP BY p.id, p.title
*/

/* Context by user ***
WITH main_visible_groups AS (
SELECT group_id FROM groups_list AS gl
	LEFT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1)
)
SELECT tl.group_id, tl.task_id, cl.context_id, c.value,
	cs.user_id, cs.inherited_id, cs.active, cs.note, cs.activity_type FROM tasks_list AS tl
RIGHT JOIN context_list AS cl ON cl.task_id = tl.task_id
RIGHT JOIN context AS c ON cl.context_id = c.id
RIGHT JOIN context_setting AS cs ON cs.context_id = cl.context_id AND cs.user_id = 1
WHERE tl.group_id IN (SELECT * FROM main_visible_groups);
*/

--SELECT add_task_context(1, 1, 3, '');
--SELECT delete_task_context(1, 1, 7);
--SELECT * FROM context;
--SELECT * FROM context_setting;
--SELECT * FROM context_list;
/*
DELETE FROM context WHERE (id = 41);
DELETE FROM context_list WHERE (context_id = 41);
DELETE FROM context_setting WHERE (context_id = 41);
*/

/* DELETE context from task
CREATE OR REPLACE FUNCTION delete_task_context(
	main_user_id INTEGER,
	inner_task_id INTEGER,
	context_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE CALLED ON NULL INPUT
AS $f$
  DECLARE
    main_group_id INTEGER;
	main_user_type INTEGER;
	main_group_reading INTEGER;
	main_el_reading INTEGER;
	main_el_updating INTEGER;
	inner_context_id INTEGER;
BEGIN
	SELECT tl.group_id, gl.user_type, g.reading, g.el_reading, g.el_updating
	  INTO main_group_id, main_user_type, main_group_reading, main_el_reading, main_el_updating FROM tasks_list AS tl
	RIGHT JOIN groups_list AS gl ON gl.group_id = tl.group_id AND (gl.user_id = main_user_id OR gl.user_id = 0)
	RIGHT JOIN groups AS g ON gl.group_id = g.id
	WHERE tl.task_id = inner_task_id;

	IF NOT FOUND THEN
	  RETURN 0;
	END IF;

    IF main_group_id IS NULL THEN
	  RETURN 0;
    END IF;

	IF main_group_reading < main_user_type THEN
	  RETURN -1;
	END IF;

	IF main_el_reading < main_user_type THEN
	  RETURN -2;
	END IF;

	IF main_el_updating < main_user_type THEN
	  RETURN -3;
	END IF;

	IF context_id is null THEN
		RETURN -4;
	END IF;

	SELECT id INTO inner_context_id FROM context WHERE id = context_id;
	IF NOT FOUND THEN
		RETURN -5;
	END IF;

	DELETE FROM context_list AS cl WHERE (cl.context_id = inner_context_id AND cl.task_id = inner_task_id);

	RETURN inner_context_id;
  END;
$f$;*/

/* ADD context to task ***
CREATE OR REPLACE FUNCTION add_task_context(
	main_user_id INTEGER,
	in_task_id INTEGER,
	context_id INTEGER,
	context_value TEXT)
RETURNS integer
LANGUAGE plpgsql
VOLATILE CALLED ON NULL INPUT
AS $f$
  DECLARE
    main_group_id INTEGER;
    main_user_type INTEGER;
	main_group_reading INTEGER;
	main_el_reading INTEGER;
	main_el_updating INTEGER;
	inner_context_id INTEGER;
	tmp_id INTEGER;
  BEGIN
	SELECT tl.group_id, gl.user_type, g.reading, g.el_reading, g.el_updating
	  INTO main_group_id, main_user_type, main_group_reading, main_el_reading, main_el_updating FROM tasks_list AS tl
	RIGHT JOIN groups_list AS gl ON gl.group_id = tl.group_id AND (gl.user_id = main_user_id OR gl.user_id = 0)
	RIGHT JOIN groups AS g ON gl.group_id = g.id
	WHERE tl.task_id = in_task_id;

	IF NOT FOUND THEN
	  RETURN 0;
	END IF;

    IF main_group_id IS NULL THEN
	  RETURN 0;
    END IF;

	IF main_group_reading < main_user_type THEN
	  RETURN -1;
	END IF;

	IF main_el_reading < main_user_type THEN
	  RETURN -2;
	END IF;

	IF main_el_updating < main_user_type THEN
	  RETURN -3;
	END IF;

	IF context_value = '' THEN
		IF context_id is null THEN
			RETURN -4;
		END IF;

		SELECT id INTO inner_context_id FROM context WHERE id = context_id;
		IF NOT FOUND THEN
			RETURN -5;
		END IF;
	ELSE
		INSERT INTO context (value) VALUES (context_value) ON CONFLICT(value) DO NOTHING RETURNING (id) INTO inner_context_id;
		IF inner_context_id IS NULL THEN
		  IF context_id IS NULL THEN
			SELECT id INTO inner_context_id FROM context WHERE value = context_value;
		  ELSE
			inner_context_id := context_id;
		  END IF;
		END IF;
	END IF;

	SELECT cl.task_id INTO tmp_id FROM context_list AS cl WHERE cl.task_id = in_task_id AND cl.context_id = inner_context_id;
	IF NOT FOUND THEN
	  INSERT INTO context_list (task_id, context_id) VALUES (in_task_id, inner_context_id);
	END IF;

	SELECT cs.context_id INTO tmp_id FROM context_setting AS cs WHERE cs.context_id = inner_context_id AND cs.user_id = main_user_id;
	IF NOT FOUND THEN
	  INSERT INTO context_setting (context_id, user_id) VALUES (inner_context_id, main_user_id);
	END IF;

	RETURN inner_context_id;
  END;
$f$;
*/

--CREATE UNIQUE INDEX ON context_list (value);

--UPDATE tasks SET parent = null WHERE task_id = 3
--SELECT * FROM context_list WHERE owner = 1
--SELECT * FROM groups_list WHERE user_id = 1
--SELECT * FROM tasks_list;
