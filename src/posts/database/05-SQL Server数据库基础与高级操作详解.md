---
isOriginal: true
title: SQL Server数据库基础与高级操作详解
date: 2018-11-13
icon: code
tag:
  - sql server
  - sql语法
  - 数据库操作
category: database
description: SQL Server数据库的数据类型、DDL、DML操作及高级特性详解，包括函数、存储过程、触发器等核心功能

sticky: false
timeline: true
article: true
star: false
---

## 1. SQL Server 概述

> 本文整理了SQL Server数据库的基本操作和高级特性，旨在帮助开发者快速入门和查阅。内容涵盖数据类型、常用函数、数据库操作等核心知识点，适合SQL Server初学者和需要快速参考的开发人员。

<!--more-->

### 1.1 数据类型

| 类型分类 | 数据类型 | 大小             | 使用说明                                                                                |
| :------- | :------- | :--------------- | :-------------------------------------------------------------------------------------- |
| 整数类型 | tinyint  | 1字节            | 无符号整数，范围：0 到 255                                                              |
|          | smallint | 2字节            | 有符号整数，范围：-32,768 到 32,767                                                    |
|          | int      | 4字节            | 有符号整数，范围：-2,147,483,648 到 2,147,483,647                                      |
|          | bigint   | 8字节            | 有符号整数，范围：-9,223,372,036,854,775,808 到 9,223,372,036,854,775,807              |
| 浮点类型 | float    | 4或8字节         | 单精度或双精度浮点数，可精确到第15位小数，范围：-1.79E308 到 1.79E+308                  |
|          | real     | 4字节            | 单精度浮点数，精确到第7位小数，范围：-3.40E38 到 3.40E38                                |
|          | decimal  | 5~17字节         | 固定精度和小数位数，语法：decimal(总位数, 小数位数)，总位数最大38位                     |
|          | numeric  | 5~17字节         | 与decimal完全相同，都是固定精度数据类型                                                 |
| 字符类型 | char     | 1~8000字节       | 固定长度字符串，不足指定长度时右侧补充空格                                              |
|          | varchar  | 1~8000字节       | 可变长度字符串，仅存储实际字符，不补充空格                                              |
|          | nchar    | 2~8000字节       | Unicode固定长度字符串，每个字符占2字节                                                  |
|          | nvarchar | 2~8000字节       | Unicode可变长度字符串，每个字符占2字节                                                  |
| 日期类型 | date     | 3字节            | 仅存储日期，范围：公元1年1月1日到9999年12月31日                                         |
|          | datetime | 8字节            | 存储日期和时间，范围：1753年1月1日00:00:00.000 到 9999年12月31日23:59:59.997，精确到3.33毫秒 |

> **注意事项：**

1. 查看数据实际占用字节数可以使用 `DATALENGTH(expression)` 函数
2. 在非Unicode字符类型中，一个汉字通常占2字节（取决于字符集）；在Unicode类型中，一个汉字占2字节
3. SQL Server 2005及以上版本支持 `varchar(max)` 和 `nvarchar(max)`，最大可存储2GB数据

[【SqlServer】Sql Server 支持的数据类型](https://www.cnblogs.com/HDK2016/p/7782303.html "参考链接")

## 1.2 常用函数

### 1.2.1 数据类型转换函数

| 函数名                       | 作用                 | 示例                                    |
| :--------------------------- | :------------------- | :-------------------------------------- |
| CONVERT(type, val)           | 将val转换为type类型  | CONVERT(date, '2018-12-30')             |
| CAST(val AS type)            | 将val转换为type类型  | CAST('2018-12-30' AS date)              |
| CONVERT(varchar, dateval, fmt) | 将日期转换为指定格式 | SELECT CONVERT(varchar, GETDATE(), 120) |
| FORMAT(val, fmt)             | 格式化数据为指定样式 | FORMAT(GETDATE(), 'yyyy/MM/dd')         |

### 1.2.2 字符串操作函数

| 函数名                  | 作用                                                       | 示例                                |
| :---------------------- | :--------------------------------------------------------- | :---------------------------------- |
| LTRIM(val)              | 去除字符串左侧空格                                         | LTRIM('     abcde')                 |
| RTRIM(val)              | 去除字符串右侧空格                                         | RTRIM('abcde     ')                 |
| LEN(val)                | 计算字符串长度（汉字和字母都算1个字符）                     | LEN('hello')                        |
| ISNULL(val1, val2)      | 如果val1为NULL，则返回val2                                 | ISNULL(NULL, 'isnull')              |
| CONCAT(val1, val2, ...) | 拼接多个字符串（自动处理NULL值）                            | CONCAT('a', 'b', 'c')               |
| STUFF(src, start, len, str) | 替换字符串指定位置的内容                              | STUFF('abcde', 1, 2, '1234')        |
| REPLACE(src, old, new)  | 替换字符串中所有指定子串                                   | REPLACE('abcde', 'a', 'w')          |
| REPLICATE(src, n)       | 将字符串重复n次                                            | REPLICATE('0', 10-LEN('123')) + '123' |
| CHARINDEX(str, src, start) | 查找子串在字符串中的位置（从1开始）                    | CHARINDEX('bc', 'abcdef', 1)        |
| PATINDEX(pattern, src)  | 查找符合模式的字符串位置（支持通配符）                     | PATINDEX('%bc%', 'abcdef')          |
| SUBSTRING(src, start, len) | 截取字符串指定部分                                    | SUBSTRING('abcdef', 1, 2)           |

> **注意事项：**

1. SQL Server 2017及以上版本已支持 `TRIM()` 函数，可直接去除字符串两端空格
2. `CHARINDEX()` 默认不区分大小写，如需区分可使用 `COLLATE Latin1_General_CS_AS`
3. `PATINDEX()` 必须使用通配符，如 `'%pattern%'`；如果不使用通配符，则需完全匹配
4. 所有函数调用均需使用 `SELECT 函数名(参数)` 形式

### 1.2.3 日期时间函数

| 函数名                   | 作用                                                   | 示例                                    |
| :----------------------- | :----------------------------------------------------- | :-------------------------------------- |
| GETDATE()                | 获取当前系统日期和时间                                 | GETDATE()                               |
| DATEDIFF(part, start, end) | 计算两个日期之间的时间间隔                        | DATEDIFF(DAY, '2018-12-30', '2019-12-30') |
| DATEADD(part, n, date)   | 在指定日期上增加或减少时间间隔                          | DATEADD(MONTH, 2, '2018-12-15')         |
| DATENAME(part, date)     | 返回日期指定部分的字符串表示                           | DATENAME(WEEKDAY, '2018-12-30')         |
| DATEPART(part, date)     | 返回日期指定部分的整数表示                             | DATEPART(MONTH, '2018-12-30')           |

### 1.2.4 数学函数

| 函数名         | 作用                      | 示例              |
| :------------- | :------------------------ | :---------------- |
| CEILING(val)   | 向上取整                  | CEILING(1.2)      |
| FLOOR(val)     | 向下取整                  | FLOOR(1.5)        |
| ROUND(val, n)  | 四舍五入到指定小数位      | ROUND(123.4232, 3) |
| POWER(val, n)  | 计算数值的n次幂           | POWER(2, 10)      |
| ABS(val)       | 计算绝对值                | ABS(-10)          |
| SQRT(val)      | 计算平方根                | SQRT(16)          |

## 1.3 数据库操作

### 1.3.1 基本数据库操作

#### 1.3.1.1 创建数据库

```sql
CREATE DATABASE db_name
ON PRIMARY
(
    NAME = 'db_name_data',
    FILENAME = 'F:\\db_name_data.mdf',
    SIZE = 10MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 10%
)
LOG ON
(
    NAME = 'db_name_log',
    FILENAME = 'F:\\db_name_log.ldf',
    SIZE = 5MB,
    MAXSIZE = 200MB,
    FILEGROWTH = 1MB
);
```

#### 1.3.1.2 删除数据库

```sql
USE master;
DROP DATABASE IF EXISTS db_name;
```

#### 1.3.1.3 备份数据库

```sql
-- 完整备份
BACKUP DATABASE db_name TO DISK = 'F:\\test.bak';

-- 差异备份
BACKUP DATABASE db_name TO DISK = 'F:\\test_diff.bak' WITH DIFFERENTIAL;

-- 日志备份
BACKUP LOG db_name TO DISK = 'F:\\test_log.bak';
```

#### 1.3.1.4 还原数据库

```sql
-- 确保数据库未被使用
USE master;

-- 强制还原完整备份
RESTORE DATABASE db_name FROM DISK = 'F:\\test.bak' WITH REPLACE;

-- 带差异备份和日志的还原
RESTORE DATABASE db_name FROM DISK = 'F:\\test.bak' WITH NORECOVERY;
RESTORE DATABASE db_name FROM DISK = 'F:\\test_diff.bak' WITH NORECOVERY;
RESTORE LOG db_name FROM DISK = 'F:\\test_log.bak' WITH RECOVERY;
```

### 1.3.2 表的基本操作

#### 1.3.2.1 创建表

```sql
USE db_name;
GO
CREATE TABLE tb_name
(
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(20) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    create_time DATETIME DEFAULT GETDATE(),
    status BIT DEFAULT 1
);
GO
```

#### 1.3.2.2 删除表

```sql
USE db_name;
DROP TABLE IF EXISTS tb_name;
```

#### 1.3.2.3 修改表

```sql
-- 添加列
ALTER TABLE tb_name ADD col_name VARCHAR(10);

-- 删除列
ALTER TABLE tb_name DROP COLUMN col_name;

-- 修改列
ALTER TABLE tb_name ALTER COLUMN col_name VARCHAR(30) NOT NULL;

-- 添加约束
ALTER TABLE tb_name ADD CONSTRAINT CK_col_name CHECK (col_name >= 0 AND col_name <= 100);
ALTER TABLE tb_name ADD CONSTRAINT DF_col_name DEFAULT (0) FOR col_name;
ALTER TABLE tb_name ADD CONSTRAINT UK_col_name UNIQUE (col_name);

-- 删除约束
ALTER TABLE tb_name DROP CONSTRAINT UK_col_name;
```

#### 1.3.2.4 主键与外键

```sql
-- 创建表时定义主键
CREATE TABLE tb_name1
(
    id INT PRIMARY KEY,
    name VARCHAR(20)
);

-- 创建表时定义外键
CREATE TABLE tb_name2
(
    id INT PRIMARY KEY,
    name VARCHAR(20),
    tb1_id INT FOREIGN KEY REFERENCES tb_name1(id)
);
```

#### 1.3.2.5 插入数据

```sql
-- 单条数据插入
INSERT INTO tb_name (name, email) VALUES ('张三', 'zhangsan@example.com');

-- 多条数据插入
INSERT INTO tb_name (name, email)
VALUES ('李四', 'lisi@example.com'),
       ('王五', 'wangwu@example.com');

-- 从其他表插入数据
INSERT INTO tb_name (name, email)
SELECT name, email FROM tb_name1 WHERE id > 10;
GO
```

#### 1.3.2.6 更新数据

```sql
UPDATE tb_name SET name = '测试', email = 'test@example.com' WHERE id = 1;
```

#### 1.3.2.7 删除数据

```sql
-- 删除表中所有数据但不释放空间
DELETE FROM tb_name;

-- 删除表中所有数据并释放空间
TRUNCATE TABLE tb_name;

-- 条件删除
DELETE FROM tb_name WHERE id = 5;
```

#### 1.3.2.8 查看表结构

```sql
-- 方法1
SP_HELP tb_name;

-- 方法2
SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tb_name';
```

### 1.3.3 索引操作

#### 1.3.3.1 创建索引

```sql
-- 创建非聚集索引
CREATE INDEX IX_tb_name_col_name ON tb_name(col_name);

-- 创建唯一索引
CREATE UNIQUE INDEX UQ_tb_name_col_name ON tb_name(col_name);

-- 创建组合索引
CREATE INDEX IX_tb_name_col1_col2 ON tb_name(col1, col2);
```

#### 1.3.3.2 删除索引

```sql
DROP INDEX IX_tb_name_col_name ON tb_name;
```

### 1.3.4 视图操作

#### 1.3.4.1 创建视图

```sql
CREATE VIEW view_name AS
SELECT id, name, email FROM tb_name WHERE status = 1;
```

#### 1.3.4.2 删除视图

```sql
DROP VIEW IF EXISTS view_name;
```

### 1.3.5 存储过程操作

#### 1.3.5.1 创建无参存储过程

```sql
USE db_name;
GO
CREATE PROCEDURE proc_name 
AS
BEGIN
    SELECT * FROM tb_name WHERE status = 1;
END;
GO
```

#### 1.3.5.2 执行存储过程

```sql
USE db_name;
EXEC proc_name;
GO
```

#### 1.3.5.3 创建带参数存储过程

```sql
USE db_name;
GO
CREATE PROCEDURE proc_name 
    @name VARCHAR(20),
    @age INT
AS
BEGIN
    SELECT * FROM tb_name WHERE name = @name AND age = @age;
END;
GO
```

#### 1.3.5.4 执行带参数存储过程

```sql
USE db_name;
EXEC proc_name '张三', 25;
GO
```

#### 1.3.5.5 创建带输出参数的存储过程

```sql
USE db_name;
GO
CREATE PROCEDURE proc_name 
    @name VARCHAR(20),
    @cnt INT OUTPUT
AS
BEGIN
    SELECT * FROM tb_name WHERE name = @name;
    SELECT @cnt = @@ROWCOUNT;
END;
GO
```

#### 1.3.5.6 执行带输出参数的存储过程

```sql
USE db_name;
DECLARE @count INT;
EXEC proc_name '张三', @count OUTPUT;
SELECT @count AS '记录数量';
GO
```

#### 1.3.5.7 删除存储过程

```sql
DROP PROCEDURE IF EXISTS proc_name;
```

### 1.3.6 触发器操作

#### 1.3.6.1 AFTER INSERT 触发器

```sql
USE db_name;
GO
CREATE TRIGGER trg_tb_name_insert ON tb_name AFTER INSERT
AS
BEGIN
    DECLARE @id INT;
    SELECT @id = id FROM inserted;
    PRINT '新增记录ID: ' + CAST(@id AS VARCHAR);
END;
GO
```

#### 1.3.6.2 AFTER UPDATE 触发器

```sql
USE db_name;
GO
CREATE TRIGGER trg_tb_name_update ON tb_name AFTER UPDATE
AS
BEGIN
    DECLARE @old_id INT, @new_id INT;
    SELECT @old_id = id FROM deleted;
    SELECT @new_id = id FROM inserted;
    PRINT '更新前ID: ' + CAST(@old_id AS VARCHAR) + ', 更新后ID: ' + CAST(@new_id AS VARCHAR);
END;
GO
```

#### 1.3.6.3 AFTER DELETE 触发器

```sql
USE db_name;
GO
CREATE TRIGGER trg_tb_name_delete ON tb_name AFTER DELETE
AS
BEGIN
    DECLARE @id INT;
    SELECT @id = id FROM deleted;
    PRINT '删除记录ID: ' + CAST(@id AS VARCHAR);
END;
GO
```

#### 1.3.6.4 INSTEAD OF 触发器

```sql
USE db_name;
GO
CREATE TRIGGER trg_tb_name_instead_insert ON tb_name INSTEAD OF INSERT
AS
BEGIN
    -- 自定义插入逻辑
    INSERT INTO tb_name (name, email) 
    SELECT name, email FROM inserted WHERE email LIKE '%@example.com%';
END;
GO
```

#### 1.3.6.5 删除触发器

```sql
DROP TRIGGER IF EXISTS trg_tb_name_insert;
```

### 1.3.7 事务操作

```sql
USE db_name;
GO
BEGIN TRAN;
BEGIN TRY
    UPDATE tb_name SET name = '测试' WHERE id = 1;
    -- 模拟其他操作
    COMMIT TRAN;
    PRINT '事务执行成功';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    PRINT '事务执行失败';
    PRINT ERROR_MESSAGE();
END CATCH;
GO
```

### 1.3.8 用户权限操作

```sql
-- 创建登录名
CREATE LOGIN [user_name] WITH PASSWORD = '123456', DEFAULT_DATABASE = db_name;

-- 创建数据库用户并关联登录名
USE db_name;
CREATE USER [user_name] FOR LOGIN [user_name];

-- 授予用户权限
USE db_name;
GRANT SELECT, INSERT ON tb_name TO [user_name];

-- 撤销用户权限
USE db_name;
REVOKE INSERT ON tb_name FROM [user_name];

-- 删除用户和登录名
USE db_name;
DROP USER [user_name];
DROP LOGIN [user_name];
```

### 1.3.9 其他常用操作

#### 1.3.9.1 生成唯一标识

```sql
-- 生成唯一标识（随机）
NEWID();

-- 生成唯一递增标识（顺序）
NEWSEQUENTIALID();
```

#### 1.3.9.2 分页查询

```sql
-- SQL Server 2012+ 推荐使用 OFFSET FETCH
SELECT * FROM tb_name 
ORDER BY id 
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;

-- 传统分页方式
SELECT TOP 10 * FROM tb_name 
WHERE id NOT IN (SELECT TOP 10 id FROM tb_name ORDER BY id) 
ORDER BY id;
```
