import { Router } from 'express';

export default (Mess) => {
  const router = Router();

  // Middleware: Check for essential info (e.g., Auth)
  router.use((req, res, next) => {
    if (!req.body.userId) {
       // return res.status(401).send('Authentication required.');
    }
    next();
  });


  // --- GET MESS DETAILS (For Client Polling) ---
  router.post('/details', async (req, res) => {
    const { messId, userId } = req.body;
    
    // Safety check for messId
    if (!messId) {
        return res.status(400).send('Mess ID is required.');
    }

    try {
      // Find by messId, explicitly include joinKey for admin
      const mess = await Mess.findOne({ messId }).select('+joinKey').lean();

      if (!mess) {
        // Correctly return 404 if the mess doesn't exist
        return res.status(404).send('Mess not found.');
      }
      
      // CRITICAL FIX: Ensure 'members' property exists and is an instance of Map 
      // before trying to convert it using Object.fromEntries.
      if (mess.members instanceof Map) {
        mess.members = Object.fromEntries(mess.members);
      }
      
      res.json(mess);
    } catch (e) {
      // CRITICAL DEBUG: Log the full error stack on the server
      console.error('CRITICAL SERVER ERROR in /details:', e.stack);
      res.status(500).send('Server error.');
    }
  });


  // --- CREATE MESS (UNCHANGED) ---
  router.post('/create', async (req, res) => {
    const { messId, name, adminUid, joinKey, members } = req.body;
    try {
      const newMess = new Mess({
        messId,
        name,
        adminUid,
        joinKey,
        members,
        expenses: [],
      });
      await newMess.save();
      res.status(201).json({ message: 'Mess created successfully.' });
    } catch (e) {
      console.error('Error creating mess:', e);
      res.status(500).send('Failed to create mess.');
    }
  });


  // --- JOIN MESS (UNCHANGED) ---
  router.post('/join', async (req, res) => {
    const { messId, joinKey, userId, userName, defaultDeposit } = req.body;

    try {
      const mess = await Mess.findOne({ messId }).select('+joinKey');

      if (!mess) {
        return res.status(404).send('Mess ID not found.');
      }
      if (mess.joinKey !== joinKey) {
        return res.status(401).send('Invalid Join Key.');
      }

      if (mess.members.get(userId)) {
          return res.status(200).json({ message: 'Already a member.' });
      }

      mess.members.set(userId, {
        name: userName,
        deposit: defaultDeposit || 0,
        meals: {},
      });

      await mess.save();

      res.status(200).json({ message: 'Joined mess successfully.' });
    } catch (e) {
      console.error('Error joining mess:', e);
      res.status(500).send('Server error during join operation.');
    }
  });


  // --- ADD EXPENSE (UNCHANGED) ---
  router.post('/expense', async (req, res) => {
    const { messId, newExpenses } = req.body;
    
    if (!newExpenses || newExpenses.length === 0) {
        return res.status(400).send('No expenses provided.');
    }

    try {
      const result = await Mess.findOneAndUpdate(
        { messId },
        { $push: { expenses: { $each: newExpenses } } },
        { new: true }
      );

      if (!result) return res.status(404).send('Mess not found.');
      res.status(200).json({ message: 'Expenses added successfully.' });

    } catch (e) {
      console.error('Error adding expense:', e);
      res.status(500).send('Server error.');
    }
  });


  // --- ADD DEPOSIT (UNCHANGED) ---
  router.post('/deposit', async (req, res) => {
    const { messId, memberUid, depositAmount } = req.body;

    const updatePath = `members.${memberUid}.deposit`;
    
    try {
      const result = await Mess.findOneAndUpdate(
        { messId },
        { $inc: { [updatePath]: depositAmount } },
        { new: true }
      );

      if (!result) return res.status(404).send('Mess not found.');
      res.status(200).json({ message: 'Deposit added successfully.' });

    } catch (e) {
      console.error('Error adding deposit:', e);
      res.status(500).send('Server error.');
    }
  });


  // --- UPDATE MEAL COUNT (UNCHANGED) ---
  router.post('/meal', async (req, res) => {
    const { messId, memberUid, dateKey, newCount } = req.body;

    const updatePath = `members.${memberUid}.meals.${dateKey}`;
    
    try {
      const result = await Mess.findOneAndUpdate(
        { messId },
        { $set: { [updatePath]: newCount } },
        { new: true }
      );

      if (!result) return res.status(404).send('Mess not found.');
      res.status(200).json({ message: 'Meal count updated successfully.' });

    } catch (e) {
      console.error('Error updating meal count:', e);
      res.status(500).send('Server error.');
    }
  });

  return router;
};