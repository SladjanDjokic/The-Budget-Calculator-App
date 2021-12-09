rename table companyServiceKey to serviceKey;

UPDATE serviceKey SET companyId=0 WHERE companyId IS NULL;

