create database ezbudget;

use ezbudget;

create table tenants (
  uid varchar(36) not null default (UUID()),
  auth0_uid varchar(100) default null,
  name varchar(50) not null,
  description varchar(1500) default null,
  email varchar(250) default null,
  preferences text default null,
  created timestamp not null default (UTC_TIMESTAMP),
  company_name varchar(150) not null,
  company_address varchar(250) not null,
  vat_no varchar(30) default null,
  primary key (uid)
);

create table movements (
  uid varchar(36) not null default (UUID()),
  tenant_uid varchar(36) not null,
  title varchar(250) not null,
  direction char(1) not null comment '(I)ncome, (E)xpense',
  description text default null,
  category_uid varchar(36) not null,
  -- subcategory_uid varchar(36) not null,
  amount float not null,
  currency varchar(3) not null,
  recurring char(1) not null default 'N' comment '(Y)es, (N)o',
  recur_type tinyint not null default 0 comment '0: None, 1: Monthly, 2: Quarterly, 3: Semi-annual, 4: Yearly',
  created_on timestamp not null default (UTC_TIMESTAMP),
  paid_on timestamp default null,
  due_date timestamp default null,
  primary key (uid)
);

create table categories (
  uid varchar(36) not null default (UUID()),
  tenant_uid varchar(36) not null,
  name varchar(50) not null,
  color varchar(9) default null,
  description text default null,
  sort_order int(10) not null default 0,
  primary key (uid)
);

/* create table subcategories (
  uid varchar(36) not null default (UUID()),
  tenant_uid varchar(36) not null,
  category_uid varchar(36) not null,
  name varchar(50) not null,
  description text default null,
  sort_order int(10) not null default 0,
  primary key (uid)
); */


/* create table files (
  uid varchar(36) not null default (UUID()),
  file_name varchar(150) not null,
  file_path varchar(500) not null,
  file_size int(10) not null default 0,
  title varchar(250) not null,
  description text default null,
  uploaded timestamp not null default (UTC_TIMESTAMP),
  mime_type varchar(200) not null,
  doc_type tinyint not null,
  tenant_uid varchar(36) default null,
  primary key (uid)
);

create table doc_types (
  id tinyint not null auto_increment,
  name varchar(30) not null,
  tenant_uid varchar(36) default null,
  primary key (id)
); */

create view vw_movements as
	select m.*, c.name, c.color, c.sort_order from movements m 
	inner join categories c on c.uid = m.category_uid;

create table calendar_info (
  uid varchar(36) not null default (UUID()),
  event_date timestamp not null,
  event_start timestamp default null,
  event_end timestamp default null,
  event_details text default null,
  event_color varchar(7) default null,
  tenant_uid varchar(36) not null,
  primary key (uid)
);

/* insert into doc_types (name)
values ('Other documents'), ('Income - Invoice'), ('Expense - Invoice'), ('Expense - Receit'), ('Expense - Other'); */

drop trigger if exists tr_after_delete_tenant;

drop procedure if exists sp_add_tenant;

delimiter //

create trigger tr_after_delete_tenant after delete on tenants for each row
  begin
    -- delete from files fi where fi.tenant_uid = old.uid;
    delete from calendar_info ci where ci.tenant_uid = old.uid;
    delete from movements mv where mv.tenant_uid = old.uid;
    -- delete from doc_types dt where dt.tenant_uid = old.uid;
    delete from categories ct where ct.tenant_uid = old.uid;
    -- delete from subcategories sb where sb.tenant_uid = old.uid;
  end;
//

create procedure sp_add_tenant (
  in auth0_uid varchar(100),
  in name varchar(50),
  in email varchar(250),
  in preferences text
)
begin
    set @uid = UUID();
    
    insert into tenants (
      uid,
      auth0_uid,
      name,
      description,
      email,
      preferences,
      company_name,
      company_address
    ) values (
      @uid,
      auth0_uid,
      name,
      'Created automatically from Auth0',
      email,
      preferences,
      'Please update',
      'Please update'
    );

  select @uid;

  end//

delimiter ;