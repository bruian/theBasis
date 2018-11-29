/* Create table - groups
CREATE TABLE groups (id serial, parent int, name varchar(100), type smallint, 
	creating smallint, reading smallint, updating smallint, deleting smallint, 
	task_creating smallint, task_reading smallint, task_updating smallint, task_deleting smallint);
*/
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
/* Create groups list table 
CREATE TABLE groups_list (user_id int, group_id int, user_type smallint);
*/
/* Select user groups 
SELECT * FROM groups_list, groups WHERE (groups_list.group_id = groups.id) AND (groups_list.user_id = 3) AND (groups_list.user_type >= groups.reading);
*/
/* Create tasks list
--ALTER TABLE tasks_list ADD PRIMARY KEY (group_id, task_id);

CREATE TABLE tasks_list (
  group_id INTEGER NOT NULL REFERENCES groups ON DELETE cascade,
  task_id INTEGER NOT NULL REFERENCES tasks ON DELETE cascade,
  PRIMARY KEY (group_id, task_id),
  p INTEGER NOT NULL, q INTEGER NOT NULL
);

CREATE UNIQUE INDEX ON tasks_list (group_id, (p::float8/q));
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
/* Other
CREATE TABLE tasks (id serial, tid int, name varchar(100), owner int);
INSERT INTO tasks (tid, name, owner) VALUES (1, 'U4:T1', 4);
SELECT * FROM tasks; DISTINCT - exclude doubles
SELECT * FROM tasks WHERE owner = 1 ORDER BY tid
SELECT * FROM tasks, users WHERE tasks.owner = users.id ORDER BY users.id;
CREATE TABLE groups_list (id serial, tid int, name varchar(100), owner int);
UPDATE groups SET type = 3, task_reading = 3, task_updating = 3, task_deleting = 2;
ALTER TABLE groups ADD COLUMN type smallint;
ALTER TABLE groups DROP COLUMN curator;
INSERT INTO groups (name, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, type) 
	VALUES ('G10', 1, 1, 1, 1, 1, 1, 1, 1, 1), ('G11', 1, 1, 1, 1, 1, 1, 1, 1, 1), ('G12', 1, 1, 1, 1, 1, 1, 1, 1, 1);
*/
/*
SELECT * FROM tasks_list AS tl 
	RIGHT JOIN groups_list AS gl ON (gl.group_id = tl.group_id)
	JOIN groups AS gr ON (gl.group_id = gr.id) AND (gl.user_id = 3) AND (gl.user_type <= gr.reading) AND (gl.user_type <= gr.task_reading);
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

/*
INSERT INTO groups (name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type) 
	VALUES ('U3.G15', null, 1, 4, 1, 1, 1, 1, 1, 1, 3),
		   ('U2.G8.2G9', 57, 1, 1, 1, 1, 1, 1, 1, 1, 2),
		   ('U2.G8.2G10', 57, 1, 1, 1, 1, 1, 1, 1, 1, 2),
		   ('U2.G8.2G10.3G11', 59, 1, 1, 1, 1, 1, 1, 1, 1, 2),
		   ('U2.G8.2G12', 57, 1, 1, 1, 1, 1, 1, 1, 1, 2),
		   ('U2.G8.2G12.3G13', 61, 1, 1, 1, 1, 1, 1, 1, 1, 2),
		   ('U2.G14', null, 1, 1, 1, 1, 1, 1, 1, 1, 2);
SELECT * FROM groups;
*/
/*
INSERT INTO groups_list (user_id, group_id, user_type) 
	VALUES (1, 63, 3),
		   (3, 64, 1),
		   (2, 59, 1),
		   (2, 60, 1),
		   (2, 61, 1),
		   (2, 62, 1),
		   (2, 63, 1);
SELECT * FROM groups_list ORDER BY user_id, group_id;
*/

/* Запрос всей иерархии группы 
WITH RECURSIVE recursive_tree (id, parent, path, user_type, level) AS (
	SELECT T1g.id, T1g.parent, CAST (T1g.id AS VARCHAR (50)) AS path, T1gl.user_type, 1
    FROM groups_list AS T1gl
	RIGHT JOIN groups AS T1g ON (T1gl.group_id = T1g.id)
	WHERE T1g.parent IS NULL AND T1gl.group_id = 50
		UNION
	SELECT T2g.id, T2g.parent, CAST (recursive_tree.PATH ||'->'|| T2g.id AS VARCHAR(50)), T2gl.user_type, level + 1
    FROM groups_list AS T2gl
	RIGHT JOIN groups AS T2g ON (T2gl.group_id = T2g.id)
	INNER JOIN recursive_tree ON (recursive_tree.id = T2g.parent)
)
SELECT recursive_tree.id, recursive_tree.user_type, grp.name, recursive_tree.parent, recursive_tree.level, recursive_tree.path,
	   grp.creating, grp.reading, grp.updating, grp.deleting, grp.task_creating, 
	   grp.task_reading, grp.task_updating, grp.task_deleting, grp.group_type FROM recursive_tree
LEFT JOIN groups AS grp ON recursive_tree.id = grp.id
ORDER BY path;
*/

/* Запрос всех групп первого уровня не принадлежащие main user. Ограничение по: видимости main user */
/* AND grp.reading >= gl.user_type ограничение видимости группы по типу пользователя
 user_type: 1-owner, 2-curator, 3-member, 4-all (все группы с таким типом имеют id = 0)
 reading->enum_reading: 0-not readable, 1-owner reading, 2-curator reading, 3-member reading, 4-reading by all */
/* AND grp.owner != 1 отбор по владельцу группы, что бы не main user */
/* выборка групп, которые не имеют потомков 
SELECT group_id, user_type, name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type, 0 AS haveChild FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id AND grp.owner != 1
	WHERE grp.parent IS null AND gl.group_id NOT IN (SELECT parent FROM groups WHERE parent IS NOT null GROUP BY parent) AND grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1)
UNION /* выборка групп, которые имеют потомков И ОБЪЕДИНЕНИЕ с той, что не имеют потомков. Индикатор haveChild*/
SELECT group_id, user_type, name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type, 1 AS haveChild FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id AND grp.owner != 1
	WHERE grp.parent IS null AND gl.group_id IN (SELECT parent FROM groups WHERE parent IS NOT null GROUP BY parent) AND grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1)
LIMIT 10 OFFSET 0
*/

/* Main groups tree
WITH RECURSIVE recursive_tree (id, parent, path, user_type, level) AS (
	SELECT T1g.id, T1g.parent, CAST (T1g.id AS VARCHAR (50)) AS path, T1gl.user_type, 1
    FROM groups_list AS T1gl
	RIGHT JOIN groups AS T1g ON (T1gl.group_id = T1g.id)
	WHERE T1g.parent IS NULL AND T1gl.user_id = 1
		UNION
	SELECT T2g.id, T2g.parent, CAST (recursive_tree.PATH ||'->'|| T2g.id AS VARCHAR(50)), T2gl.user_type, level + 1
    FROM groups_list AS T2gl
	RIGHT JOIN groups AS T2g ON (T2gl.group_id = T2g.id)
	INNER JOIN recursive_tree ON (recursive_tree.id = T2g.parent)
)
SELECT recursive_tree.id, recursive_tree.user_type, grp.name, recursive_tree.parent, recursive_tree.level, recursive_tree.path,
	   grp.creating, grp.reading, grp.updating, grp.deleting, grp.task_creating, 
	   grp.task_reading, grp.task_updating, grp.task_deleting, grp.group_type FROM recursive_tree
LEFT JOIN groups AS grp ON recursive_tree.id = grp.id
ORDER BY path;
*/


/*
SELECT user_id, group_id, owner, user_type, name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id
*/

/* Выборка друзей моего друга 
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

/*
INSERT INTO users_personality (user_id, name, dateofbirth, city, country, phone)
	VALUES (1, 'Dergach Виктор', '1984-03-29', 'Krasnoyarsk', 'Russia', '+7 (905) 976-54-53');
	
INSERT INTO users_photo (user_id, isavatar, url)
	VALUES (1, true, 'https://s3.amazonaws.com/uifaces/faces/twitter/fabbianz/128.jpg');
*/

/*
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

/*
ALTER TABLE tasks
    ADD COLUMN ends timestamp;
*/

--ALTER TABLE context_list RENAME COLUMN id_user TO id_task;

/*
SELECT * FROM groups_list, groups WHERE 
		(groups_list.group_id = groups.id) 
	AND (groups_list.user_id = 3) 
	AND (groups_list.user_type >= groups.reading);
*/

--CREATE TABLE context (id serial, value varchar(1024));
--CREATE TABLE context_list (id_user int, id_context int);
--CREATE TABLE context_setting (id_context int, id_user int, id_inherited int, active bool, note varchar(2000), activity_type smallint)

/*
ALTER TABLE public.tasks
    ALTER COLUMN ends TYPE timestamp with time zone ;
*/

/*
INSERT INTO tasks (tid, name, owner, status, duration, note) 
	VALUES (2, 'Китайский язык - повторение материала', 1, 2, 2400000, '');
SELECT task_place_list(1, 4, NULL, TRUE);
SELECT * FROM tasks_list ORDER BY group_id, (p::float8/q);
INSERT INTO context (value) VALUES ('Китайский язык');
INSERT INTO context_list (id_task, id_context) VALUES (3, 3);
INSERT INTO context_setting (id_context, id_user, id_inherited, active, note, activity_type) VALUES (3, 1, 0, true, 'Изучение языков', 1);
*/

/* AND grp.reading >= gl.user_type ограничение видимости группы по типу пользователя
 user_type: 1-owner, 2-curator, 3-member, 4-all (все группы с таким типом имеют id = 0)
 reading->enum_reading: 0-not readable, 1-owner reading, 2-curator reading, 3-member reading, 4-reading by all
CREATE VIEW main_visible_groups AS
SELECT group_id, user_type, name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type, owner FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1);
*/

/* Выбрать все задачи пользователя 
выбираются группы пользователя, 
по списку групп формируется список задач
список задач присоединяет к себе смежные данные по задаче
отдельно выбираются многострочные части типа список контекстов
*/

/* view:main_visible_groups: group_id, user_type, name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type, owner */
/* tasks_list: group_id, task_id 
WITH main_visible_groups AS (
SELECT group_id, user_type, name, parent, creating, reading, updating, deleting, task_creating, task_reading, task_updating, task_deleting, group_type, owner FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1)
)
SELECT tl.task_id, tsk.tid, tsk.name, tsk.owner AS tskowner, tsk.status, tsk.duration, tsk.note, mvg.group_id, mvg.owner AS growner FROM main_visible_groups AS mvg
	  JOIN tasks_list AS tl ON mvg.group_id = tl.group_id
	  LEFT JOIN tasks AS tsk ON tl.task_id = tsk.id
	  ORDER BY tl.group_id, (tl.p::float8/tl.q);
*/

--UPDATE tasks_list SET group_id = 50 WHERE task_id = 3
--SELECT * FROM context_list WHERE owner = 1
--SELECT * FROM groups_list WHERE user_id = 1
--SELECT * FROM tasks_list;

/*
-- find an intermediate fraction between p1/q1 and p2/q2.
--
-- The fraction chosen is the highest fraction in the Stern-Brocot
-- tree which falls strictly between the specified values. This is
-- intended to avoid going deeper in the tree unnecessarily when the
-- list is already sparse due to deletion or moving of items, but in
-- fact the case when the two items are already adjacent in the tree
-- is common so we shortcut it. As a bonus, this method always
-- generates fractions in lowest terms, so there is no need for GCD
-- calculations anywhere.
--
-- Inputs must not be null (caller's responsibility), but the value
-- p2=1 q2=0 is allowed for the upper bound without causing any
-- division by zero errors.
 
CREATE OR REPLACE FUNCTION find_intermediate(p1 INTEGER, q1 INTEGER,
                                             p2 INTEGER, q2 INTEGER,
                                             OUT p INTEGER, OUT q INTEGER)
  LANGUAGE plpgsql immutable strict
AS $f$
  DECLARE
    pl INTEGER := 0;
    ql INTEGER := 1;
    ph INTEGER := 1;
    qh INTEGER := 0;
  BEGIN
    IF (p1::BIGINT*q2 + 1) <> (p2::BIGINT*q1) THEN
      loop
        p := pl + ph;
        q := ql + qh;
        IF (p::BIGINT*q1 <= q::BIGINT*p1) THEN
          pl := p; ql := q;
        elsif (p2::BIGINT*q <= q2::BIGINT*p) THEN
          ph := p; qh := q;
        ELSE
          exit;
        END IF;
      END loop;
    ELSE
      p := p1 + p2;
      q := q1 + q2;
    END IF;
  END;
$f$;
													  
-- insert or move item TSK_ID in group GRP_ID next to REL_ID,
-- before it if IS_BEFORE is true, otherwise after. REL_ID may
-- be null to indicate a position off the end of the list.

-- вставить или переместить запись TSK_ID в группе GRP_ID,
-- после REL_ID если IS_BEFORE=true, в противном случае до REL_ID.
-- REL_ID может иметь значени NULL, что указывает позицию конеца списка.

CREATE OR REPLACE FUNCTION task_place_list(grp_id INTEGER,
                                           tsk_id INTEGER,
                                           rel_id INTEGER,
                                           is_before BOOLEAN)
  RETURNS void
  LANGUAGE plpgsql
  volatile called ON NULL INPUT
AS $f$
  DECLARE
    p1 INTEGER; q1 INTEGER;   -- fraction below insert position | дробь позже вставляемой позиции
    p2 INTEGER; q2 INTEGER;   -- fraction above insert position | дробь раньше вставляемой позиции
    r_rel DOUBLE PRECISION;   -- p/q of the rel_id row			| p/q значение rel_id строки
    np INTEGER; nq INTEGER;   -- new insert position fraction
  BEGIN
  	-- perform выполняет select без возврата результата
    -- lock the groups
    perform 1 FROM groups g WHERE g.id=grp_id FOR UPDATE;
 
    -- moving a record to its own position is a no-op
    IF rel_id=tsk_id THEN RETURN; END IF;
 
    -- if we're positioning next to a specified row, it must exist
    IF rel_id IS NOT NULL THEN
      SELECT tl.p, tl.q INTO strict p1, q1
        FROM tasks_list tl
       WHERE tl.group_id=grp_id AND tl.task_id=rel_id;
      r_rel := p1::float8 / q1;
    END IF;
 
    -- find the next adjacent row in the desired direction
    -- (might not exist).
    IF is_before THEN
      p2 := p1; q2 := q1;
      SELECT tl2.p, tl2.q INTO p1, q1
        FROM tasks_list tl2
       WHERE tl2.group_id=grp_id AND tl2.task_id <> tsk_id
         AND (p::float8/q) < COALESCE(r_rel, 'infinity')
       ORDER BY (p::float8/q) DESC LIMIT 1;
    ELSE
      SELECT tl2.p, tl2.q INTO p2, q2
        FROM tasks_list tl2
       WHERE tl2.group_id=grp_id AND tl2.task_id <> tsk_id
         AND (p::float8/q) > COALESCE(r_rel, 0)
       ORDER BY (p::float8/q) ASC LIMIT 1;
    END IF;
 
    -- compute insert fraction
    SELECT * INTO np, nq FROM find_intermediate(COALESCE(p1, 0), COALESCE(q1, 1),
                                               COALESCE(p2, 1), COALESCE(q2, 0));
 
    -- move or insert the specified row
    UPDATE tasks_list
       SET (p,q) = (np,nq) WHERE group_id=grp_id AND task_id=tsk_id;
    IF NOT found THEN
      INSERT INTO tasks_list VALUES (grp_id, tsk_id, np, nq);
    END IF;
 
    -- want to renormalize both to avoid possibility of integer overflow
    -- and to ensure that distinct fraction values map to distinct float8
    -- values. Bounding to 10 million gives us reasonable headroom while
    -- not requiring frequent normalization.
 
    IF (np > 10000000) OR (nq > 10000000) THEN
      perform grp_renormalize(grp_id);
    END IF;
  END;
$f$;
 
-- Renormalize the fractions of items in GRP_ID, preserving the
-- existing order. The new fractions are not strictly optimal, but
-- doing better would require much more complex calculations.
--
-- the purpose of the complex update is as follows: we want to assign
-- a new series of values 1/2, 3/2, 5/2, ... to the existing rows,
-- maintaining the existing order, but because the unique expression
-- index is not deferrable, we want to avoid assigning any new value
-- that collides with an existing one.
--
-- We do this by calculating, for each existing row with an x/2 value,
-- which position in the new sequence it would appear at. This is done
-- by adjusting the value of p downwards according to the number of
-- earlier values in sequence. To see why, consider:
--
--   existing values:    3, 9,13,15,23
--   new simple values:  1, 3, 5, 7, 9,11,13,15,17,19,21
--                          *     *  *        *
--   adjusted values:    1, 5, 7,11,17,19,21,25,27,29,31
--
--   points of adjustment: 3, 7 (9-2), 9 (13-4, 15-6), 15 (23-8)
--
-- The * mark the places where an adjustment has to be applied.
--
-- Having calculated the adjustment points, the adjusted value is
-- simply the simple value adjusted upwards according to the number of
-- points passed (counting multiplicity).
 
CREATE OR REPLACE FUNCTION grp_renormalize(grp_id INTEGER)
  RETURNS void
  LANGUAGE plpgsql
  volatile strict
AS $f$
  BEGIN
    perform 1 FROM groups g WHERE g.id=grp_id FOR UPDATE;
	
    UPDATE tasks_list tl SET p=s2.new_rnum, q=2
      FROM (SELECT task_id,
                   is_existing = 0 AS is_new,
                   -- increase the current value according to the
                   -- number of adjustment points passed
                   rnum + 2*(SUM(is_existing)
                               OVER (ORDER BY rnum))
                     AS new_rnum
              FROM (
                    -- assign the initial simple values to every item
		    -- in order
                    SELECT task_id,
                           2*(ROW_NUMBER() OVER (ORDER BY p::float8/q)) - 1
                             AS rnum,
                           0 AS is_existing
                      FROM tasks_list tl2
                     WHERE tl2.group_id=grp_id
                    UNION ALL
                    -- and merge in the adjustment points required to
                    -- skip over existing x/2 values
                    SELECT task_id,
                           p + 2 - 2*(COUNT(*) OVER (ORDER BY p))
                             AS rnum,
                           1 AS is_existing
                      FROM tasks_list tl3
                     WHERE tl3.group_id=grp_id
                       AND tl3.q=2
                   ) s1
           ) s2
     WHERE s2.task_id=tl.task_id
       AND s2.is_new
       AND tl.group_id=grp_id;
  END;
$f$;
*/