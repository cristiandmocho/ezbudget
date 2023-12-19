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

create table files (
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
  primary key (id)
);

create table calendar_info (
  uid varchar(36) not null default (UUID()),
  work_date timestamp not null,
  work_start timestamp default null,
  work_end timestamp default null,
  work_details text default null,
  customer_uid varchar(36) not null,
  primary key (uid),
  constraint uc_calendar unique (work_date, customer_uid)
);

insert into doc_types (name)
values ('Other documents'), ('Company constitution'), ('Address proof'), ('Bank details'), ('Customer contract'), ('Service provider contract');

drop view if exists vw_calendar_info;

create view vw_calendar_info as
select
  ci.work_date,
  ci.work_start,
  ci.work_end,
  ci.work_details,
  ci.customer_uid,
  cu.name,
  cu.color,
  cu.type,
  cu.tenant_uid
from calendar_info ci
  inner join customers cu on ci.customer_uid = cu.uid
order by
  cu.name,
  ci.work_date,
  ci.work_start;

drop trigger if exists tr_after_delete_tenant;

drop procedure if exists sp_add_calendar_info;
drop procedure if exists sp_add_tenant;

delimiter //

create trigger tr_after_delete_tenant after delete on tenants for each row
  begin
    delete from files fi where fi.tenant_uid = old.uid;
  end;
//

create procedure sp_add_calendar_info (in work_date date, in customer_uid varchar(36))
  begin
    set @uid = UUID();
    
    insert into calendar_info (uid, work_date, customer_uid) values (@uid, work_date, customer_uid);

    select @uid;

  end//

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