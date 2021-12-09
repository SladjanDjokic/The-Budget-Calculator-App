-- DROP TABLE `companyServiceKey`;

-- ALTER TABLE `accommodation` ADD COLUMN `propertyTypeId` bigint(20) NULL;

-- CREATE TABLE `destinationPropertyType` (
--   `destinationId` bigint(20) NOT NULL,
--   `propertyTypeId` bigint(20) NOT NULL
-- );
--
-- CREATE TABLE `destinationRegion` (
--   `destinationId` bigint(20) NOT NULL,
--   `regionId` bigint(20) NOT NULL
-- );
--
-- CREATE TABLE `propertyType` (
--   `id` bigint(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `name` varchar(20) NOT NULL
-- );
--
-- CREATE TABLE `region` (
--   `id` bigint(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `name` varchar(100) NOT NULL
-- );

-- CREATE TABLE `serviceKey` (
--   `id` bigint(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,
--   `companyId` bigint(20) NULL,
--   `serviceType` varchar(50) NULL,
--   `serviceName` varchar(50) NULL,
--   `serviceKey` mediumtext NULL
-- );

-- ALTER TABLE `user` MODIFY `companyId` bigint(20) DEFAULT 0 NOT NULL;

-- ALTER TABLE `accommodation` ADD CONSTRAINT `accommodation_propertyType_id_fk` FOREIGN KEY (`propertyTypeId`) REFERENCES `propertyType` (`id`);

-- ALTER TABLE `destinationPropertyType` ADD CONSTRAINT destinationPropertyType_destination_id_ck PRIMARY KEY (`destinationId`, `propertyTypeId`);
--
-- ALTER TABLE `destinationPropertyType` ADD CONSTRAINT `destinationPropertyType_destination_id_fk` FOREIGN KEY (`destinationId`) REFERENCES `destination` (`id`);
--
-- ALTER TABLE `destinationPropertyType` ADD CONSTRAINT `destinationPropertyType_propertyType_id_fk` FOREIGN KEY (`propertyTypeId`) REFERENCES `propertyType` (`id`);
--
-- ALTER TABLE `destinationRegion` ADD CONSTRAINT `destinationRegion_pk` UNIQUE (`destinationId`, `regionId`);
--
-- ALTER TABLE `destinationRegion` ADD CONSTRAINT `destinationRegion_destination_id_fk` FOREIGN KEY (`destinationId`) REFERENCES `destination` (`id`);
--
-- ALTER TABLE `destinationRegion` ADD CONSTRAINT `destinationRegion_region_id_fk` FOREIGN KEY (`regionId`) REFERENCES `region` (`id`);
--
-- ALTER TABLE `propertyType` ADD CONSTRAINT `propertyTypes_name_uindex` UNIQUE (`name`);
--
-- ALTER TABLE `propertyType` ADD CONSTRAINT `propertyType_id_uindex` UNIQUE (`id`);
--
-- ALTER TABLE `region` ADD CONSTRAINT `region_name_uindex` UNIQUE (`name`);
--
-- ALTER TABLE `region` ADD CONSTRAINT `region_id_uindex` UNIQUE (`id`);
--
-- ALTER TABLE `serviceKey` ADD CONSTRAINT `companyServiceKey_id_uindex` UNIQUE (`id`);
--
-- ALTER TABLE `serviceKey` ADD CONSTRAINT `companyServiceKey_company_id_fk` FOREIGN KEY (`companyId`) REFERENCES `company` (`id`);

-- ALTER TABLE `user` ADD CONSTRAINT `user_primaryEmail_uindex` UNIQUE (`primaryEmail`);