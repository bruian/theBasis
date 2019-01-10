/* Create table - tasks list */
CREATE TABLE tasks_list (
  group_id INTEGER NOT NULL REFERENCES groups ON DELETE cascade,
  task_id INTEGER NOT NULL REFERENCES tasks ON DELETE cascade,
  PRIMARY KEY (group_id, task_id),
  p INTEGER NOT NULL, q INTEGER NOT NULL
);

CREATE UNIQUE INDEX ON tasks_list (group_id, (p::float8/q));
--ALTER TABLE tasks_list ADD PRIMARY KEY (group_id, task_id);

CREATE TABLE tasks (
	id 			serial,
	parent 	integer,
	tid 		integer,
	name 		varchar(300),
	note		varchar(2000),
	owner 	integer,
	status 	smallint,
	duration integer,
	PRIMARY KEY(id)
);

--ALTER TABLE tasks ADD COLUMN ends timestamp; --deprecated
--ALTER TABLE public.tasks ALTER COLUMN ends TYPE timestamp with time zone; --deprecated

/* Insert new task record and place into tasks_list by task_place_list() procedure
INSERT INTO tasks (tid, name, owner, status, duration, note, parent)
	VALUES (6, 'Подзадача для id=1 и tid=1', 1, 2, 2400000, '', 1);
SELECT task_place_list(1, 7, 6, FALSE);
*/

/* UPDATE task fields <for API>
	gl.user_id = <0> - constant for select at ALL users
	tl.task_id = <1> - need api value
	gl.user_id = <1> - need api value
*/
WITH main_visible_task AS (
	SELECT tl.task_id FROM groups_list AS gl
		LEFT JOIN groups AS grp ON gl.group_id = grp.id
		RIGHT JOIN tasks_list AS tl ON gl.group_id = tl.group_id AND tl.task_id = 1
	WHERE (grp.reading >= gl.user_type)
		AND (grp.el_reading >= gl.user_type)
		AND (grp.el_updating >= gl.user_type)
		AND (gl.user_id = 0 OR gl.user_id = 1)
)
UPDATE tasks SET name = 'Hello people' WHERE id IN (SELECT * FROM main_visible_task);

--SELECT * FROM tasks; DISTINCT - exclude doubles
--SELECT * FROM tasks WHERE owner = 1 ORDER BY tid
--SELECT * FROM tasks, users WHERE tasks.owner = users.id ORDER BY users.id;

/* Выборка всех задач из списка с сортировкой по группам и пользовательскому порядку */
SELECT * FROM tasks_list ORDER BY group_id, (p::float8/q);

/* Простейшая выборка всех доступных задач из списка с фильтром по пользователю */
SELECT * FROM tasks_list AS tl
	RIGHT JOIN groups_list AS gl ON (gl.group_id = tl.group_id)
	JOIN groups AS gr
		ON (gl.group_id = gr.id)
		AND (gl.user_id = 3)
		AND (gl.user_type <= gr.reading)
		AND (gl.user_type <= gr.el_reading);

/* Выборка всех задач пользователя
	1) Выбираются группы пользователя (относительно группы и её разрешений получаются задачи)
	2) По массиву групп формируется список задач (выбираются все задачи из tasks_list с фильтром по группам)
	3) Список задач присоединяет к себе смежные данные по задаче
	4) Сортировка списка по группам -> внутри группы в соответствии с пользовательским порядком
*/
WITH main_visible_groups AS (
	SELECT gl.group_id, gl.user_type, grp.reading, grp.el_reading, grp.owner FROM groups_list AS gl
		RIGHT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE (grp.reading >= gl.user_type)
		AND (grp.el_reading >= gl.user_type)
		AND (gl.user_id = 0 OR gl.user_id = 1)
)
SELECT tl.task_id, tsk.tid, tsk.name, tsk.owner AS task_owner,
			tsk.status, tsk.duration, tsk.note, tsk.parent,
			mvg.group_id, mvg.owner AS group_owner FROM main_visible_groups AS mvg
	JOIN tasks_list AS tl ON mvg.group_id = tl.group_id
	LEFT JOIN tasks AS tsk ON tl.task_id = tsk.id
ORDER BY tl.group_id, (tl.p::float8/tl.q);

/* Вариант с фильтром по одной группе и с флагом наличия потомков */
WITH main_visible_groups AS (
SELECT group_id FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE (grp.reading >= gl.user_type)
		AND (grp.el_reading >= gl.user_type)
		AND (gl.user_id = 0 OR gl.user_id = 1)
),
SELECT tl.task_id, tl.group_id, tl.p, tl.q,
	tsk.tid, tsk.name, tsk.owner AS tskowner,
	tsk.status, tsk.duration, tsk.note, tsk.parent,
	(SELECT COUNT(*) FROM tasks WHERE parent = tsk.id) AS havechild
FROM tasks_list AS tl
RIGHT JOIN tasks AS tsk ON tl.task_id = tsk.id
WHERE tl.group_id IN (SELECT * FROM main_visible_groups) AND tsk.parent = 1
ORDER BY (tl.p::float8/tl.q);

/* Иерархическая выборка всех задач пользователя
	1) Выбираются группы пользователя (относительно группы и её разрешений получаются задачи)
	2) По массиву групп формируется рекурсивное дерево задач (помимо основных задач, выбираются связанные под задачи)
	3) К элементам дерева задач присоединяются смежные данные по задачам
	4) Список сортируется по группам -> внутри группы в соответствии с пользовательским порядком
*/
WITH RECURSIVE main_visible_groups AS (
	SELECT group_id FROM groups_list AS gl
	RIGHT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE (grp.reading >= gl.user_type)
		AND (grp.el_reading >= gl.user_type)
		AND (gl.user_id = 0 OR gl.user_id = 1)
), recursive_tree (id, parent, path, group_id, p, q, level) AS (
	SELECT t_one.id, t_one.parent, CAST (t_one.id AS VARCHAR (50)) AS path,
		tl_one.group_id, tl_one.p, tl_one.q, 1 FROM tasks_list AS tl_one
		RIGHT JOIN tasks AS t_one ON (tl_one.task_id = t_one.id)
		WHERE t_one.parent = 0 AND tl_one.group_id IN (SELECT group_id FROM main_visible_groups)
	UNION
	SELECT t_two.id, t_two.parent, CAST (recursive_tree.PATH ||'->'|| t_two.id AS VARCHAR(50)), tl_two.group_id, tl_two.p, tl_two.q, level + 1
    FROM tasks_list AS tl_two
		RIGHT JOIN tasks AS t_two ON (tl_two.task_id = t_two.id)
		INNER JOIN recursive_tree ON (recursive_tree.id = t_two.parent)
)
SELECT tsk.id AS task_id, tsk.tid, tsk.name, tsk.owner AS tskowner,
			tsk.status, tsk.duration, tsk.note, recursive_tree.group_id,
			recursive_tree.p, recursive_tree.q, recursive_tree.parent FROM recursive_tree
	LEFT JOIN tasks AS tsk ON recursive_tree.id = tsk.id
ORDER BY recursive_tree.group_id, (recursive_tree.p::float8/recursive_tree.q);

/* выбираем все группы которые видимы main пользователю и
   помещаем в таблицу main_visible_groups,
   затем строим иерархию задач по родителю для определения глубины иерархии
   А в Целевой выборке мы получаем все задачи входящие в main_visible_groups
   в соответствии с заданной пользователем последовательностью хранения
   задач (сортировка по полям tl.p/tl.q по принципу дробления числа)
*/
/*main_user, to_group_id, task_id, to_task_id, isBefore, to_parent*/
--SELECT reorder_task(1, 1, 4, null, FALSE, 0);
--SELECT reorder_task(1, 50, 6, 7, FALSE, 1);
--SELECT reorder_task(1, 50, 5, 7, FALSE, 1);
--UPDATE tasks_list SET group_id = 1 WHERE task_id = 4;

/* tasks by parent id getTasks ***
CREATE TEMP TABLE temp_task ON COMMIT DROP AS WITH RECURSIVE main_visible_groups AS (
SELECT group_id FROM groups_list AS gl
	LEFT JOIN groups AS grp ON gl.group_id = grp.id
	WHERE grp.reading >= gl.user_type AND (gl.user_id = 0 OR gl.user_id = 1)
), descendants(id, parent, depth, path) AS (
    SELECT id, parent, 1 depth, ARRAY[id] FROM tasks --WHERE parent is null
UNION
	SELECT t.id, t.parent, d.depth + 1, path || t.id FROM tasks t
	JOIN descendants d ON t.parent = d.id
)
SELECT tl.task_id, tl.group_id, tl.p, tl.q,
	tsk.tid, tsk.name, tsk.owner AS tskowner,
	tsk.status, tsk.duration, tsk.note, tsk.parent,
	(SELECT COUNT(*) FROM tasks WHERE parent = tsk.id) AS havechild,
	dsc.depth
FROM tasks_list AS tl
RIGHT JOIN tasks AS tsk ON tl.task_id = tsk.id
JOIN (SELECT max(depth) AS depth, descendants.path[1] AS parent_id FROM descendants GROUP BY descendants.path[1]) AS dsc ON tl.task_id = dsc.parent_id
WHERE tl.group_id IN (SELECT * FROM main_visible_groups) --AND tsk.parent is null
ORDER BY tl.group_id, (tl.p::float8/tl.q);

SELECT * FROM temp_task;

SELECT cl.task_id, cl.context_id, c.value, cs.inherited_id, cs.active, cs.note, cs.activity_type FROM context_list AS cl
LEFT JOIN context AS c ON c.id = cl.context_id
LEFT JOIN context_setting AS cs ON cs.context_id = cl.context_id AND cs.user_id = 1
WHERE cl.task_id in (select task_id from temp_task);
*/

/* TEST OPERATIONS for add_task */
SELECT add_task(1, 1, 0);
SELECT * from tasks;
SELECT * from tasks_list;
DELETE FROM tasks WHERE id = 9;
DELETE FROM tasks_list where task_id = 9;

/* Create new task in tasks table, and add it in tasks_list table
	 0 - Group for main user not found
  -1 - No rights to read the group
  -2 - No rights to read the el by the ID
  -3 - No rights to create the el in the group
*/
CREATE OR REPLACE FUNCTION add_task(
	main_user_id INTEGER,
	in_group_id INTEGER,
	in_parent_id INTEGER,
	isStart BOOL)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE CALLED ON NULL INPUT
AS $f$
DECLARE
	main_user_type INTEGER;
	main_group_reading INTEGER;
	main_el_reading INTEGER;
	main_el_creating INTEGER;
	task_id INTEGER;
	tid INTEGER;
	parent INTEGER;
BEGIN
	SELECT gl.user_type, g.reading, g.el_creating, g.el_reading
	  INTO main_user_type, main_group_reading, main_el_creating, main_el_reading FROM groups_list AS gl
	LEFT JOIN groups AS g ON gl.group_id = g.id
	WHERE (gl.user_id = main_user_id OR gl.user_id = 0) AND (gl.group_id = in_group_id);

	IF NOT FOUND THEN
	  RETURN 0;
	END IF;

	IF main_group_reading < main_user_type THEN
	  RETURN -1;
	END IF;

	IF main_el_reading < main_user_type THEN
	  RETURN -2;
	END IF;

	IF main_el_creating < main_user_type THEN
	  RETURN -3;
	END IF;

	SELECT count(id) INTO tid FROM tasks WHERE (owner = main_user_type);
	tid := tid + 1;

	INSERT INTO tasks (id, tid, name, owner, status, duration, note, parent)
		VALUES (DEFAULT, tid, '', main_user_type, 0, 0, '', in_parent_id)
		RETURNING id INTO task_id;

	parent := in_parent_id;
	IF in_parent_id = 0 THEN
		parent := null;
	END IF;

	PERFORM task_place_list(in_group_id, task_id, parent, NOT isStart);

	RETURN task_id;
  END;
$f$;

/* Delete task in tasks table, and add it in tasks_list table
	 0 - Group for main user not found
  -1 - No rights to read the group
  -2 - No rights to read the task by the ID
  -3 - No rights to delete the task in the group
  -4 - Can not delete. Task have subelement
*/
CREATE OR REPLACE FUNCTION delete_task(
	main_user_id INTEGER,
	in_task_id INTEGER,
	in_group_id INTEGER,
	isOnlyFromList BOOL)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE CALLED ON NULL INPUT
AS $f$
DECLARE
	main_user_type INTEGER;
	main_group_reading INTEGER;
	main_el_reading INTEGER;
	main_el_deleting INTEGER;
	countchild INTEGER;
BEGIN
	SELECT gl.user_type, g.reading, g.el_deleting, g.el_reading
	  INTO main_user_type, main_group_reading, main_el_deleting, main_el_reading FROM groups_list AS gl
	LEFT JOIN groups AS g ON gl.group_id = g.id
	WHERE (gl.user_id = main_user_id OR gl.user_id = 0) AND (gl.group_id = in_group_id);

	IF NOT FOUND THEN
	  RETURN 0;
	END IF;

	IF main_group_reading < main_user_type THEN
	  RETURN -1;
	END IF;

	IF main_el_reading < main_user_type THEN
	  RETURN -2;
	END IF;

	IF main_el_deleting < main_user_type THEN
	  RETURN -3;
	END IF;

	SELECT count(id) INTO countchild FROM tasks WHERE parent = in_task_id;
	IF countchild > 0 THEN
	  RETURN -4;
	END IF;

	IF isOnlyFromList = TRUE THEN
	  DELETE FROM tasks_list WHERE (task_id = in_task_id) AND (group_id = in_group_id);
	  UPDATE tasks SET parent = 0 WHERE (id = in_task_id);
	ELSE
	  DELETE FROM tasks_list WHERE (task_id = in_task_id);
	  DELETE FROM tasks WHERE (id = in_task_id);
	  DELETE FROM context_list WHERE (task_id = in_task_id);
	END IF;

	RETURN 1;
  END;
$f$;

/* return
	0 - moving a record to its own position is a no-op
  1 - operation complete
	2 - user is not assigned this group or this group no public
	3 - user does not have permissions to read this group
	4 - user does not have permissions to updating this group
*/
CREATE OR REPLACE FUNCTION reorder_task(
	main_user_id INTEGER,
	grp_id INTEGER,
  tsk_id INTEGER,
  rel_id INTEGER,
  is_before BOOLEAN,
	new_parent INTEGER
)
  RETURNS integer
  LANGUAGE plpgsql
  volatile called ON NULL INPUT
AS $f$
  DECLARE
	before_group_id INTEGER; before_parent_id INTEGER;
    main_group_id INTEGER; main_group_reading INTEGER;
    main_group_updating INTEGER; main_user_type INTEGER;
	rel_group_id INTEGER;
  BEGIN
	SELECT group_id, grp.reading, grp.updating, gl.user_type
	  INTO main_group_id, main_group_reading,
	       main_group_updating, main_user_type FROM groups_list gl
	LEFT JOIN groups grp ON gl.group_id = grp.id
    WHERE gl.group_id = grp_id AND (gl.user_id = 0 OR gl.user_id = main_user_id);

	IF NOT FOUND THEN
	  RETURN 2;
	END IF;

    IF main_group_id IS NULL THEN
	  RETURN 2;
    END IF;

	IF main_group_reading < main_user_type THEN
	  RETURN 3;
	END IF;

	IF main_group_updating < main_user_type THEN
	  RETURN 4;
	END IF;

    -- moving a record to its own position is a no-op
    --IF rel_id=tsk_id THEN RETURN 0; END IF;

	SELECT tl.group_id, t.parent
	INTO strict before_group_id, before_parent_id FROM tasks_list AS tl
	LEFT JOIN tasks AS t ON t.id = tl.task_id
	WHERE tl.task_id = tsk_id
	GROUP BY tl.group_id, t.parent;

	IF new_parent IS NOT NULL THEN
		IF new_parent <> before_parent_id THEN
			UPDATE tasks SET parent = new_parent WHERE id = tsk_id;
		END IF;
	END IF;

	IF rel_id IS NULL THEN
		perform task_place_list(grp_id, tsk_id, rel_id, is_before);
	ELSE
		SELECT tl.group_id
		INTO strict rel_group_id FROM tasks_list AS tl
		WHERE tl.task_id = rel_id;

		--IF before_group_id <> rel_group_id THEN
		IF grp_id <> rel_group_id THEN
			perform task_place_list(grp_id, tsk_id, null, FALSE);
		ELSE
			perform task_place_list(grp_id, tsk_id, rel_id, is_before);
		END IF;

		--perform task_place_list(grp_id, tsk_id, rel_id, is_before);
	END IF;

    -- lock the tasks_list
    --perform 1 FROM tasks_list tl WHERE tl.task_id=before_group_id FOR UPDATE;

	IF before_group_id <> main_group_id THEN
		DELETE FROM tasks_list WHERE (group_id = before_group_id) AND (task_id = tsk_id);
 	END IF;

	return 1;
  END;
$f$;

-- insert or move item TSK_ID in group GRP_ID next to REL_ID,
-- before it if IS_BEFORE is true, otherwise after. REL_ID may
-- be null to indicate a position off the end of the list.

-- вставить или переместить запись TSK_ID в группе GRP_ID,
-- после REL_ID если IS_BEFORE=true, в противном случае до REL_ID.
-- REL_ID может иметь значени NULL, что указывает позицию конеца списка.
CREATE OR REPLACE FUNCTION task_place_list(
	grp_id INTEGER,
  tsk_id INTEGER,
  rel_id INTEGER,
  is_before BOOLEAN
)
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
