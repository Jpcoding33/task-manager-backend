import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("ProjectHubDB", "sa", "Jaypal@0212", {
  host: "127.0.0.1",
  port: 1433,
  dialect: "mssql",
  logging: false,
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
});

const connectDB = async () => {
  return sequelize.authenticate();
};

export default connectDB;
