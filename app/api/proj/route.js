import { connectToDatabase } from "../../lib/mongodb";
import UploadTicket from "../../model/UploadTicket";
import Drive from "../../model/Drive";
import User from "../../model/User";  // Make sure User is imported
import { NextResponse } from "next/server";



/*---------------------------------- USER SIDE ------------------------------------------*/
//create proj
export async function POST(req) {

    await connectToDatabase();
    try {
        const { name, locationOnDisk, size, originalTime, priority, user , group , pubilc, permanent , lock} = await req.json();
        

        if (!user){ console.log("401"); return NextResponse.json({ status: 401, message: "Unauthorized" }); };

        const userReq = await User.findOne({ username: user }).exec();
        if (!userReq) return NextResponse.json({ status: 403, message: "Forbidden" });

        console.log("hello")
        const response = await Drive.create({
            user: userReq._id, // Save user ID instead of entire object
            name,
            locationOnDisk,
            size,
            originalTime,
            priority,
            public : pubilc,
            group,
            permanent,
            lock
        });
        return NextResponse.json({ projId: response._id });
    } catch (err) {
        console.error(err + ": createProject");
        return NextResponse.json({ status: 500, error: err.message });
    }
}

//update 
//@Uploading
export async function PATCH(req) {

    await connectToDatabase();
    try {
        const { projId, uploadTicketId } = await req.json();

        if (!projId || !uploadTicketId) return NextResponse.json({ status: 400, message: "Missing required fields" });

        // Check for duplicate
        const projCheck = await Drive.findById(projId);
        if (!projCheck || ["uploading", "onDrive"].includes(projCheck.status)) {
            return NextResponse.json({ status: 208, message: "Already uploading or on drive" });
        }

        const proj = await Drive.findByIdAndUpdate(projId, { status: "uploading" }, { new: true });
        const uploadTicket = await UploadTicket.findByIdAndUpdate(uploadTicketId, { status: "uploading" }, { new: true });

        if (!proj || !uploadTicket) return NextResponse.json({ status: 404, message: "Project or Upload Ticket not found" });

        return NextResponse.json({ status: 200, message: "Upload started" });
    } catch (err) {
        console.error(err + " ; uploadingProject");
        return NextResponse.json({ status: 500, error: err.message });
    }
}
