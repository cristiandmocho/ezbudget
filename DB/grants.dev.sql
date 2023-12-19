create USER IF NOT exists 'ezbudget_user' identified with mysql_native_password by 'hg76rtg&YVBUIyvf&*6rv67fv';

grant all privileges on ezbudget.* to 'ezbudget_user';

REVOKE Alter ON ezbudget.*
FROM
  'ezbudget_user';

REVOKE Create ON ezbudget.*
FROM
  'ezbudget_user';

REVOKE Create view ON ezbudget.*
FROM
  'ezbudget_user';

REVOKE Drop ON ezbudget.*
FROM
  'ezbudget_user';

REVOKE Grant option ON ezbudget.*
FROM
  'ezbudget_user';

REVOKE Index ON ezbudget.*
FROM
  'ezbudget_user';

REVOKE Alter routine ON ezbudget.*
FROM
  'ezbudget_user';

REVOKE Create routine ON ezbudget.*
FROM
  'ezbudget_user';

flush privileges;