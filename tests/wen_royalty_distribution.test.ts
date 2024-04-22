describe("wen_royalty_distribution", () => {
  describe("a sale", () => {
    describe("using SOL as payment", () => {
      before(async () => {
        // setup group account
      });
      describe("distribution", () => {
        before(async () => {
          // setup the distribution
        });
        describe("after initializing", () => {
          it.skip("should have a distribution account");
          it.skip("should be derived from the group account address");
        });
      });

      describe("after listing for sale", () => {
        it.skip("should have a sale account");
        it.skip("should be derived from the group account address");
      });

      describe("after a selling", () => {
        describe("royalties", () => {
          it.skip("should be sent to the distribution vault");
        });
        describe("the seller", () => {
          it.should("receive the payment minus royalties");
          it.should("should not be the owner anymore");
        });
        describe("the buyer", () => {
          it.should("should be the owner");
        });
      });
    });

    describe("using SPL token as payment", () => {
      // same expectations as above
    });
  });
});
