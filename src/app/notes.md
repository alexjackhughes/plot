## TO-DO

1. **Utility Functions**

   - I think we have all the utility functions we need to handle the data.

2. **Supabase Setup**

   - We need to set up the new Supabase and explore the types.

3. **Events File**

   - We basically need to redo the whole `events` file so that it works with the new data format.

4. **New Request Handling File**
   - We need a new file for handling the other type of request.

---

### Details on Wearable ID Handling

We get a wearable ID. The watch is asking for a list of settings for this wearable, to block the nine types of beacons. Here’s what we need to do:

1. **Retrieve the Wearable**

   - Get the wearable from the wearable ID.

2. **Retrieve the Organisation**

   - Get the organisation from the wearable.

3. **Get Beacons**

   - Fetch the nine types of beacons using the organisation ID.

4. **Check Against Allow List**
   - Check this wearable ID against the allow list for each of the nine types.

The beacons on the other side should have a type, which is one of the nine types (SmallMachine, etc). This links 1:1 with the nine types and the allow list for the organisation.

We are then making edits to this list, rather than to the beacon itself. We are also using this type to fetch the users.
