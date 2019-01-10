/* Create table - groups */
CREATE TABLE groups (
	id 			serial,
	parent 	int,
	name 		varchar(100),
	type 		smallint,
	creating smallint, reading smallint, updating smallint, deleting smallint,
	el_creating smallint, el_reading smallint, el_updating smallint, el_deleting smallint
);

/* Change table columns name */
--task_creating smallint, task_reading smallint, task_updating smallint, task_deleting smallint
--to
--el_creating smallint, el_reading smallint, el_updating smallint, el_deleting smallint
ALTER TABLE groups RENAME COLUMN task_creating TO el_creating;
ALTER TABLE groups RENAME COLUMN task_reading TO el_reading;
ALTER TABLE groups RENAME COLUMN task_updating TO el_updating;
ALTER TABLE groups RENAME COLUMN task_deleting TO el_deleting;

/* Create groups list table
CREATE TABLE groups_list (user_id int, group_id int, user_type smallint);
*/
/* Select user groups
SELECT * FROM groups_list, groups WHERE (groups_list.group_id = groups.id) AND (groups_list.user_id = 3) AND (groups_list.user_type >= groups.reading);
*/

/* Other
CREATE TABLE groups_list (id serial, tid int, name varchar(100), owner int);
UPDATE groups SET type = 3, el_reading = 3, el_updating = 3, el_deleting = 2;
ALTER TABLE groups ADD COLUMN type smallint;
ALTER TABLE groups DROP COLUMN curator;
INSERT INTO groups (name, creating, reading, updating, deleting, el_creating, el_reading, el_updating, el_deleting, type)
	VALUES ('G10', 1, 1, 1, 1, 1, 1, 1, 1, 1), ('G11', 1, 1, 1, 1, 1, 1, 1, 1, 1), ('G12', 1, 1, 1, 1, 1, 1, 1, 1, 1);
*/

/*
INSERT INTO groups (name, parent, creating, reading, updating, deleting, el_creating, el_reading, el_updating, el_deleting, group_type)
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
	   grp.creating, grp.reading, grp.updating, grp.deleting, grp.el_creating,
	   grp.el_reading, grp.el_updating, grp.el_deleting, grp.group_type FROM recursive_tree
LEFT JOIN groups AS grp ON recursive_tree.id = grp.id
ORDER BY path;
*/

/* Запрос всех групп первого уровня не принадлежащие main user. Ограничение по: видимости main user */
/* AND grp.reading >= gl.user_type ограничение видимости группы по типу пользователя
 user_type: 1-owner, 2-curator, 3-member, 4-all (все группы с таким типом имеют id = 0)
 reading->enum_reading: 0-not readable, 1-owner reading, 2-curator reading, 3-member reading, 4-reading by all */
/* AND grp.owner != 1 отбор по владельцу группы, что бы не main user */
/* выборка групп, которые не имеют потомков
SELECT group_id, user_type, name, parent, creating, reading, updating, deleting, el_creating, el_reading, el_updating, el_deleting, group_type, 0 AS haveChild FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id AND grp.owner != 1
	WHERE grp.parent IS null AND gl.group_id NOT IN (SELECT parent FROM groups WHERE parent IS NOT null GROUP BY parent) AND grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1)
UNION /* выборка групп, которые имеют потомков И ОБЪЕДИНЕНИЕ с той, что не имеют потомков. Индикатор haveChild*/
SELECT group_id, user_type, name, parent, creating, reading, updating, deleting, el_creating, el_reading, el_updating, el_deleting, group_type, 1 AS haveChild FROM groups_list AS gl
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
) select * from recursive_tree
SELECT recursive_tree.id, recursive_tree.user_type, grp.name, recursive_tree.parent, recursive_tree.level, recursive_tree.path,
	   grp.creating, grp.reading, grp.updating, grp.deleting, grp.el_creating,
	   grp.el_reading, grp.el_updating, grp.el_deleting, grp.group_type FROM recursive_tree
LEFT JOIN groups AS grp ON recursive_tree.id = grp.id
ORDER BY path;
*/

/****************
SELECT user_id, group_id, owner, user_type, name, parent, creating, reading, updating, deleting, el_creating, el_reading, el_updating, el_deleting, group_type FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id
*/

/****************
SELECT * FROM groups_list, groups WHERE
		(groups_list.group_id = groups.id)
	AND (groups_list.user_id = 3)
	AND (groups_list.user_type >= groups.reading);
*/

/* AND grp.reading >= gl.user_type ограничение видимости группы по типу пользователя
 user_type: 1-owner, 2-curator, 3-member, 4-all (все группы с таким типом имеют id = 0)
 reading->enum_reading: 0-not readable, 1-owner reading, 2-curator reading, 3-member reading, 4-reading by all
CREATE VIEW main_visible_groups AS
SELECT group_id, user_type, name, parent, creating, reading, updating, deleting, el_creating, el_reading, el_updating, el_deleting, group_type, owner FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1);
*/

/* Test: data manipulations for UPDATE task_fields
select * from groups_list;
DELETE FROM groups_list WHERE (group_id = 1) AND (user_id = 1);
INSERT INTO groups_list (group_id, user_id, user_type) VALUES (1,1,1);
*/
