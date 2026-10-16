# Zero-byte stored files

Observed on 2026-10-15: the latest five PDF/PNG files in
`D:/DEV/vat_li_be/hethongvatli1/uploads` have length 0 on disk, before FE reads them.

In `FileStorageServiceImpl.storeFile(InputStream, ...)`, MinIO receives the
input stream first. If its upload fails after consuming bytes, local fallback
uses `Files.copy` on the same stream without reopening it. This can save an
empty or truncated file. Chunk merge records the size of the temporary merged
file, rather than checking the bytes finally stored, so metadata can still
report a nonzero size.

Required BE correction (not applied; changes are restricted to FE): provide a
fresh stream for each storage attempt, for example by spooling to a temporary
file and reopening it for MinIO and local fallback. Validate the stored byte
count before returning success. Clean up temporary data and incomplete storage
objects. Test MinIO failure after partial and complete consumption of the input
stream, with byte-for-byte comparison of the local result.

FE now rejects empty download responses and byte counts that disagree with
known file size, before creating preview/download object URLs. Existing empty
files need their original content uploaded again after storage is corrected.
This validation detects damage; it cannot restore bytes missing from BE storage.

Upload success follows BE responses without downloading the stored file again.
Chunk progress reaches 100 percent after a successful, valid merge response.
Empty or incomplete file checks still apply when users open or download files.
