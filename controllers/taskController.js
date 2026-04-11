const mongoose = require('mongoose');
const Task = require('../models/Task');

// ─── Helper: check for a valid MongoDB ObjectId ──────────────────────────────

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── GET /tasks ───────────────────────────────────────────────────────────────

const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET-Single-Task /tasks/:id ───────────────────────────────────────────────

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID.' });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, error: `Task with ID ${id} not found.` });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// ─── POST /tasks ──────────────────────────────────────────────────────────────

const createTask = async (req, res, next) => {
  try {
    const { title, completed } = req.body;

    // Lean validation before hitting the DB
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Title is required and must be a non-empty string.',
      });
    }

    const task = await Task.create({
      title,
      // only set completed if explicitly provided, otherwise let the model default kick in
      ...(completed !== undefined && { completed }),
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(' ') });
    }
    next(err);
  }
};

// ─── PUT /tasks/:id ───────────────────────────────────────────────────────────

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID.' });
    }

    const { title, completed } = req.body;

    // Validate fields that were actually sent
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ success: false, error: 'Title must be a non-empty string.' });
      }
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Completed must be a boolean.' });
    }

    // Build only the fields provided — avoids accidentally blanking other fields
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (completed !== undefined) updates.completed = completed;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update.' });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      updates,
      { returnDocument: 'after', runValidators: true, lean: false } // return updated doc + re-run schema validators
    );

    if (!task) {
      return res.status(404).json({ success: false, error: `Task with ID ${id} not found.` });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(' ') });
    }
    next(err);
  }
};

// ─── DELETE /tasks/:id ────────────────────────────────────────────────────────

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid task ID.' });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ success: false, error: `Task with ID ${id} not found.` });
    }

    res.status(200).json({ success: true, message: `Task "${task.title}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
