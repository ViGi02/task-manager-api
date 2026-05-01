const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      minlength: [1, 'Title must not be empty.'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    /*
      category — matches the CATEGORIES list in the frontend's config.js.
      Using an enum ensures only valid values are stored.
    */
    category: {
      type: String,
      enum: ['general', 'work', 'personal', 'urgent'],
      default: 'general',
    },
    /*
      dueDate — optional. Stored as a Date so MongoDB can
      sort and filter by date if needed later.
      null means "no due date set".
    */
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
