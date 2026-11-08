import {
  InstitutionalAlumniRecordModel,
  IInstitutionalAlumniRecordDocument,
} from '../models/InstitutionalAlumniRecord.model.js';

export class InstitutionalRecordRepository {
  async findByAlumniId(alumniId: string): Promise<IInstitutionalAlumniRecordDocument | null> {
    return InstitutionalAlumniRecordModel.findOne({
      institutionalAlumniId: alumniId.toUpperCase(),
    });
  }

  async createOrUpdateRecord(
    record: Partial<IInstitutionalAlumniRecordDocument>
  ): Promise<IInstitutionalAlumniRecordDocument> {
    return InstitutionalAlumniRecordModel.findOneAndUpdate(
      { institutionalAlumniId: record.institutionalAlumniId?.toUpperCase() },
      record,
      { new: true, upsert: true }
    );
  }

  async batchInsert(records: Partial<IInstitutionalAlumniRecordDocument>[]): Promise<any> {
    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: { institutionalAlumniId: record.institutionalAlumniId?.toUpperCase() },
        update: { $set: record },
        upsert: true,
      },
    }));
    return InstitutionalAlumniRecordModel.bulkWrite(bulkOps);
  }

  async markAsClaimed(id: string, userId: string): Promise<void> {
    await InstitutionalAlumniRecordModel.findByIdAndUpdate(id, {
      isClaimed: true,
      claimedByUserId: userId as any,
    });
  }
}

export const institutionalRecordRepository = new InstitutionalRecordRepository();
