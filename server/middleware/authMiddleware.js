import jwt from "jsonwebtoken";
import Company from "../models/Company.js";
import { getAuth } from '@clerk/express';

export const protectUser = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Sign in to continue' });
  req.userId = userId;
  next();
};

export const protectCompany = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded.id !== 'string' || !/^[a-f\d]{24}$/i.test(decoded.id)) throw new Error('Invalid identity');

    req.company = await Company.findById(decoded.id).select("-password");

    if (!req.company) {
      return res.status(401).json({
        success: false,
        message: "Company not found",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};
