import {
  getEquipmentByQrToken,
  updateEquipment,
} from "@/services/equipmentService";
import {
  getHistoryForEquipment,
  addMaintenanceToEquipment,
} from "@/services/historyService";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { getFirebaseApp } from "@/firebase/config";
import { addActivityLog } from "@/services/activityLogService";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  console.log(`[API GET /equipment/${token}] Received request.`);

  try {
    console.log(
      `[API GET /equipment/${token}] Attempting to fetch equipment by QR TOKEN...`
    );
    const equipment = await getEquipmentByQrToken(token);

    if (equipment) {
      console.log(
        `[API GET /equipment/${token}] Equipment found:`,
        equipment.instrument
      );
      console.log(
        `[API GET /equipment/${token}] Attempting to fetch history for equipment ID: ${equipment.id}`
      );
      const history = await getHistoryForEquipment(equipment.id);
      console.log(
        `[API GET /equipment/${token}] Found ${history.length} history records.`
      );
      return NextResponse.json({ ...equipment, historial: history });
    } else {
      console.log(
        `[API GET /equipment/${token}] Equipment NOT FOUND for QR Token: ${token}`
      );
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error(`[API GET /equipment/${token}] CRITICAL ERROR:`, error);
    return NextResponse.json(
      { error: "Failed to fetch equipment data: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  console.log(`[API POST /equipment/${token}] Received request.`);

  try {
    const body = await request.json();
    const { maintenanceData, user } = body;

    console.log(`[API POST /equipment/${token}] Finding equipment...`);
    const existingEquipment = await getEquipmentByQrToken(token);

    if (!existingEquipment) {
      console.log(`[API POST /equipment/${token}] Equipment not found.`);
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    console.log(`[API POST /equipment/${token}] Adding maintenance task...`);
    await addMaintenanceToEquipment(
      existingEquipment.id,
      maintenanceData,
      user || "Mobile User"
    );

    console.log(
      `[API POST /equipment/${token}] Re-fetching equipment with updated history...`
    );
    const updatedHistory = await getHistoryForEquipment(existingEquipment.id);
    const updatedEquipment = {
      ...existingEquipment,
      historial: updatedHistory,
    };

    console.log(
      `[API POST /equipment/${token}] Success. Returning updated equipment.`
    );
    return NextResponse.json(updatedEquipment);
  } catch (error: any) {
    console.error(`[API POST /equipment/${token}] CRITICAL ERROR:`, error);
    return NextResponse.json(
      { error: "Failed to add maintenance: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  console.log(`[API PUT /equipment/${token}] Received request.`);

  try {
    const body = await request.json();
    const { taskId, newStatus, user } = body;

    if (!taskId || !newStatus) {
      return NextResponse.json(
        { error: "Task ID and new status are required." },
        { status: 400 }
      );
    }

    console.log(`[API PUT /equipment/${token}] Finding equipment...`);
    const equipment = await getEquipmentByQrToken(token);
    if (!equipment) {
      console.log(`[API PUT /equipment/${token}] Equipment not found.`);
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }

    const app = getFirebaseApp();
    const db = getFirestore(app);
    const taskRef = doc(db, "equipment-history", taskId);

    console.log(
      `[API PUT /equipment/${token}] Updating task ${taskId} to status ${newStatus}.`
    );
    await updateDoc(taskRef, { status: newStatus });

    await addActivityLog({
      user: user || "Mobile User",
      actionType: "MAINTENANCE_STATUS_UPDATED",
      description: `Updated task status to ${newStatus} for equipment "${equipment.instrument}"`,
      details: {
        equipmentId: equipment.id,
        equipmentName: equipment.instrument,
        taskId,
        newStatus,
      },
    });

    console.log(
      `[API PUT /equipment/${token}] Re-fetching equipment with updated history...`
    );
    const updatedHistory = await getHistoryForEquipment(equipment.id);
    const updatedEquipment = { ...equipment, historial: updatedHistory };

    console.log(
      `[API PUT /equipment/${token}] Success. Returning updated equipment.`
    );
    return NextResponse.json(updatedEquipment);
  } catch (error: any) {
    console.error(`[API PUT /equipment/${token}] CRITICAL ERROR:`, error);
    return NextResponse.json(
      { error: "Failed to update maintenance status: " + error.message },
      { status: 500 }
    );
  }
}
