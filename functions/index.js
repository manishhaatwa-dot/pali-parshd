// =========================================================
// Parshd
// Firebase Cloud Functions
// New Complaint FCM Notifications
// =========================================================

const {
  setGlobalOptions
} = require("firebase-functions");

const {
  onDocumentCreated
} = require("firebase-functions/v2/firestore");

const {
  initializeApp
} = require("firebase-admin/app");

const {
  getFirestore
} = require("firebase-admin/firestore");

const {
  getMessaging
} = require("firebase-admin/messaging");


// =========================================================
// FIREBASE ADMIN INITIALIZATION
// =========================================================

initializeApp();

const db = getFirestore();

const messaging = getMessaging();


// =========================================================
// GLOBAL OPTIONS
// =========================================================

setGlobalOptions({
  maxInstances: 10
});


// =========================================================
// PARSHD FCM TOKEN PATH
// =========================================================

const PARSHAD_COLLECTION =
  "parshd/parshads/data";


// =========================================================
// NEW COMPLAINT NOTIFICATION
// =========================================================

exports.sendParshdComplaintNotification =
  onDocumentCreated(
    "parshd/complaints/data/{complaintId}",
    async (event) => {

      // -----------------------------------------------------
      // GET COMPLAINT
      // -----------------------------------------------------

      const complaintSnapshot =
        event.data;

      if (!complaintSnapshot) {

        console.warn(
          "Parshd notification: complaint snapshot missing."
        );

        return null;
      }


      const complaint =
        complaintSnapshot.data();

      if (!complaint) {

        console.warn(
          "Parshd notification: complaint data missing."
        );

        return null;
      }


      // -----------------------------------------------------
      // COMPLAINT INFORMATION
      // -----------------------------------------------------

      const complaintId =
        event.params.complaintId;

      const parshadId =
        String(
          complaint.parshadId || ""
        ).trim();

      const wardNumber =
        String(
          complaint.wardNumber ||
          complaint.wardId ||
          ""
        ).trim();

      const publicComplaintId =
        String(
          complaint.publicComplaintId ||
          complaintId
        ).trim();


      // -----------------------------------------------------
      // VALIDATION
      // -----------------------------------------------------

      if (!parshadId) {

        console.warn(
          "Parshd notification skipped: parshadId missing.",
          {
            complaintId
          }
        );

        return null;
      }


      // =====================================================
      // GET PARSHAD DEVICE TOKENS
      // =====================================================

      const parshadRef =
        db
          .collection(
            PARSHAD_COLLECTION
          )
          .doc(
            parshadId
          );


      const tokenCollection =
        await parshadRef
          .collection(
            "fcmTokens"
          )
          .get();


      if (
        tokenCollection.empty
      ) {

        console.log(
          "No FCM tokens found for Parshad:",
          parshadId
        );

        return null;
      }


      // =====================================================
      // COLLECT TOKENS
      // =====================================================

      const tokenDocuments = [];

      const tokens = [];


      tokenCollection.forEach(
        (tokenDocument) => {

          const tokenData =
            tokenDocument.data();

          const token =
            String(
              tokenData?.token || ""
            ).trim();


          if (token) {

            tokens.push(token);

            tokenDocuments.push({
              id: tokenDocument.id,
              token
            });

          }

        }
      );


      if (
        tokens.length === 0
      ) {

        console.log(
          "Parshad has no valid FCM tokens:",
          parshadId
        );

        return null;
      }


      // =====================================================
      // NOTIFICATION CONTENT
      // =====================================================

      const title =
        "नई शिकायत प्राप्त हुई";


      const body =
        wardNumber
          ? `Ward ${wardNumber} में नई शिकायत आई है। Complaint ID: ${publicComplaintId}`
          : `नई शिकायत आई है। Complaint ID: ${publicComplaintId}`;


      // =====================================================
      // MAX 500 TOKENS PER MULTICAST
      // =====================================================

      const tokenBatches = [];


      for (
        let i = 0;
        i < tokens.length;
        i += 500
      ) {

        tokenBatches.push(
          tokens.slice(
            i,
            i + 500
          )
        );

      }


      // =====================================================
      // SEND NOTIFICATIONS
      // =====================================================

      const invalidTokens = [];


      for (
        const batch of tokenBatches
      ) {

        try {

          const response =
            await messaging.sendEachForMulticast({

              tokens:
                batch,

              notification: {

                title,

                body

              },

              data: {

                type:
                  "parshd_new_complaint",

                complaintId:
                  String(
                    complaintId
                  ),

                publicComplaintId,

                parshadId,

                wardNumber

              },

              webpush: {

                notification: {

                  title,

                  body,

                  icon:
                    "/assets/icons/icon-192.png",

                  badge:
                    "/assets/icons/icon-192.png"

                }

              }

            });


          // -------------------------------------------------
          // CHECK INVALID TOKENS
          // -------------------------------------------------

          response.responses.forEach(
            (result, index) => {

              if (
                !result.success
              ) {

                const errorCode =
                  result.error?.code ||
                  "";


                if (

                  errorCode ===
                    "messaging/registration-token-not-registered"

                  ||

                  errorCode ===
                    "messaging/invalid-registration-token"

                ) {

                  invalidTokens.push(
                    batch[index]
                  );

                }

              }

            }
          );


          console.log(
            "Parshd FCM notification result:",
            {
              parshadId,

              complaintId,

              successCount:
                response.successCount,

              failureCount:
                response.failureCount
            }
          );


        } catch (error) {

          console.error(
            "Parshd FCM notification send error:",
            error
          );

        }

      }


      // =====================================================
      // REMOVE INVALID TOKENS
      // =====================================================

      if (
        invalidTokens.length > 0
      ) {

        const deletePromises = [];


        for (
          const tokenDocument
          of tokenDocuments
        ) {

          if (
            invalidTokens.includes(
              tokenDocument.token
            )
          ) {

            deletePromises.push(
              parshadRef
                .collection(
                  "fcmTokens"
                )
                .doc(
                  tokenDocument.id
                )
                .delete()
            );

          }

        }


        try {

          await Promise.all(
            deletePromises
          );


          console.log(
            "Removed invalid Parshd FCM tokens:",
            invalidTokens.length
          );


        } catch (error) {

          console.warn(
            "Unable to remove invalid Parshd FCM tokens:",
            error
          );

        }

      }


      return null;

    }
  );
