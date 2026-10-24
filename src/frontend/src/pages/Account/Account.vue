<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col">
            <FNavbar />
            <Spinner />
        </div>
        <FFooter />
    </div>
    <div v-if="oldUsername || oldEmail">
        <div ref="top" class="bg-bg grow flex flex-col scroll-smooth">
            <NavbarAuthenticated/>
            <!-- eslint-disable vue/attribute-hyphenation -->
            <NFlexibleModal
                :hide="modals.deleteAccount"
                header="Delete Account Confirmation"
                :cancel="() => modals.deleteAccount = false"
                :cont="confirmDeleteAccount"
                continueText="Confirm"
                :showInput="false"
            >
                <p
                    class="text-secondary-text mt-10"

                ><!-- eslint-disable-next-line max-len-->
                This action will delete your account and all of its associated data <b>from this folderr instance.</b> Your files may take time to be removed from the service.<br></p>
                <template #warning>
                    <div
                        class="
                            flex
                            items-center
                            justify-center
                            p-2
                            px-8
                            text-text
                            font-bold
                            bg-yellow-600
                            text-center
                            border-2
                            border-yellow-600
                            rounded-lg
                            mt-4
                            md:max-w-screen-sm
                            3xl:max-w-full
                            break-words
                            max-w-screen-sm
                            font-info
                        "
                    >
                        <ExclamationIcon
                            class="min-h-6 min-w-6 w-20 h-20 lg:w-10 lg:h-10 text-yellow-300 mr-4"
                            aria-hidden="true"
                        />
                        <b>This action is irreversible. All of your data will be removed.</b>
                    </div>
                </template>
            </NFlexibleModal>

            <NFlexibleModal
                :hide="modals.tokens.createToken"
                header="Input Token Description"
                :cancel="tokenCreateModal"
                :cont="createToken"
                :greenContinue="true"
                :showInput="true"
                placeholder="Something descriptive"
                :needInput="true"
            >
                <p
                    class="text-secondary-text mt-2 font-info"
                >Input a description for your token below</p>
            </NFlexibleModal>
            <FlexibleModal
                :hide="modals.tokens.showDetails"
                header="Token Details"
                :cont="() => modals.tokens.showDetails = false"
                :cancel="() => modals.tokens.showDetails = false"
                :greenContinue="true"
                :noCancel="true"
                :showInput="false"
            >
                <template #warning>
                    <div
                        class="
                            flex
                            items-center
                            justify-center
                            p-2
                            px-8
                            text-text
                            font-bold
                            bg-yellow-600
                            text-center border-2
                            border-yellow-600
                            rounded-lg
                            mt-4
                            md:max-w-screen-sm
                            3xl:max-w-full
                            break-words
                            max-w-screen-sm
                            font-info m-auto
                        ">
                        <ExclamationIcon
                            class="
                                min-h-6
                                min-w-6
                                w-20
                                h-20
                                lg:w-10
                                lg:h-10
                                text-yellow-300
                                justify-center
                                mr-4
                            "
                            aria-hidden="true"/>
                        <!-- eslint-disable-next-line max-len -->
                        You will only see this token once. Store this token somewhere safe. Don't store on a shared PC.
                    </div>
                </template>

                <div class="text-text mt-4 text-lg">
                    <h1 class="font-info"><b>Token</b></h1>
                    <div class="flex flex-shrink bg-tertiary-bg rounded-lg mt-2">
                        <input
                            readonly
                            title="Your API authentication token"
                            :value='tokenInfo.token'
                            class="
                                bg-tertiary-bg
                                p-4
                                placeholder-secondary-text
                                rounded-lg
                                w-full
                                truncate
                                font-input
                                text-secondary-text text-sm
                            "
                        >
                        <button
                            class="text-brand hover:text-brand-darkened mx-4"
                            title="Copy the token"
                            @click="copy(tokenInfo.token)"
                        >
                            <ClipboardCopyIcon
                                v-if="!copied"
                                class="h-5 w-5 hover:text-brand-darkened text-brand"
                                aria-hidden="true"
                            />
                            <ClipboardCheckIcon
                                v-if="copied"
                                class="h-5 w-5 hover:text-brand-darkened text-brand"
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                    <div class="my-4">
                        <h2 class="text-text font-info">Description</h2>
                        <p
                            class="
                                text-sm
                                font-input
                                text-secondary-text
                                max-w-max
                                py-2
                                rounded-lg
                                mt-2
                            ">{{tokenInfo.description}}</p>
                    </div>
                    <div>
                        <h2 class="text-text text-md font-info">ShareX configuration</h2>
                        <div class="bg-secondary-bg rounded-md p-4 truncate font-input text-sm">
                            <code>{<br>
                            &emsp;&emsp;"Version": "14.0.1",<br>
                            <!-- eslint-disable max-len -->
                            &emsp;&emsp;"Name": "{{url.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')}} Image Host",<br>
                            &emsp;&emsp;"DestinationType": "ImageUploader, TextUploader, FileUploader",<br>
                            <!-- eslint-enable max-len -->
                            &emsp;&emsp;"RequestMethod": "POST",<br>
                            &emsp;&emsp;"RequestURL": "{{url}}/api/file",<br>
                            &emsp;&emsp;"Headers": {<br>
                            &emsp;&emsp;&emsp;&emsp;"authorization": "{{tokenInfo.token}}"<br>
                            &emsp;&emsp;},<br>
                            &emsp;&emsp;"Body": "MultipartFormData",<br>
                            &emsp;&emsp;"FileFormName": "image"<br>
                            }<br>
                            </code>
                            <!-- I must say. That is a rather annoying break of style.-->
                        </div>
                        <!-- eslint-enable vue/attribute-hypenation -->
                        <!-- Client side ability to download or copy the config. -->
                        <div class="flex flex-wrap gap-3 mt-4">
                            <button
                                type="button"
                                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] border border-[#3c3c3c] text-text font-bold text-xs transition"
                                @click="downloadSharexConfig()"
                            >
                                <DocumentDownloadIcon class="w-4 h-4 text-brand" aria-hidden="true"/>
                                <span>Download SXCU</span>
                            </button>
                            <button
                                type="button"
                                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] border border-[#3c3c3c] text-text font-bold text-xs transition"
                                @click="copySharexConfig()"
                            >
                                <ClipboardCopyIcon class="w-4 h-4 text-brand" aria-hidden="true"/>
                                <span>Copy Config</span>
                            </button>
                        </div>
                    </div>
                </div>

            </FlexibleModal>
            <SuccessesErrors ref="sne" />
            <main class="container mx-auto px-4 py-8 grow flex flex-col max-w-5xl text-text">
                <!-- Page Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 class="text-3xl font-extrabold text-brand tracking-tight flex items-center gap-3">
                            <CogIcon class="w-8 h-8 text-brand inline-block" />
                            Account Settings
                        </h1>
                        <p class="text-secondary-text text-sm mt-1">
                            Manage your personal credentials, privacy choices, and API access tokens
                        </p>
                    </div>

                    <div class="flex items-center gap-3">
                        <router-link
                            to="/gallery"
                            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-secondary-text hover:text-text border border-[#3c3c3c] text-sm transition font-medium"
                        >
                            <PhotographIcon class="w-4 h-4" />
                            <span>View Gallery</span>
                        </router-link>
                    </div>
                </div>

                <!-- Modern Sticky Inner Navigation Bar -->
                <div class="sticky top-20 z-20 bg-[#1e1e1e]/95 backdrop-blur-md p-1.5 rounded-xl border border-[#383838] mb-8 flex items-center justify-between gap-2 shadow-lg">
                    <div class="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                        <button
                            type="button"
                            @click="scrollToSection('account')"
                            :class="[
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap',
                                activeSection === 'account'
                                    ? 'bg-brand text-bg font-bold shadow'
                                    : 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
                            ]"
                        >
                            <UserIcon class="w-4 h-4" />
                            <span>Account Info</span>
                        </button>

                        <button
                            type="button"
                            @click="scrollToSection('privacy')"
                            :class="[
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap',
                                activeSection === 'privacy'
                                    ? 'bg-brand text-bg font-bold shadow'
                                    : 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
                            ]"
                        >
                            <ShieldCheckIcon class="w-4 h-4" />
                            <span>Security & Privacy</span>
                        </button>

                        <button
                            type="button"
                            @click="scrollToSection('tokens')"
                            :class="[
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap',
                                activeSection === 'tokens'
                                    ? 'bg-brand text-bg font-bold shadow'
                                    : 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
                            ]"
                        >
                            <KeyIcon class="w-4 h-4" />
                            <span>API Tokens</span>
                            <span
                                :class="[
                                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                                    activeSection === 'tokens' ? 'bg-bg/20 text-bg' : 'bg-[#2a2a2a] text-secondary-text'
                                ]"
                            >
                                {{ tokens.length }}
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Section 1: Account Info Card -->
                <div
                    ref="accountSection"
                    class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-8 mb-8"
                >
                    <div>
                        <h2 class="text-xl font-bold text-text flex items-center gap-2.5 mb-1">
                            <UserIcon class="w-5 h-5 text-brand" />
                            <span>Profile & Credentials</span>
                        </h2>
                        <p class="text-secondary-text text-xs sm:text-sm">
                            Update your Folderr username, email address, and authentication password.
                        </p>
                    </div>

                    <!-- Emailer Disabled Warning -->
                    <div
                        v-if="emailerDisabled"
                        class="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 text-xs text-yellow-300 flex items-center gap-3"
                    >
                        <ExclamationIcon class="w-5 h-5 flex-shrink-0" />
                        <span>You cannot change your email address because an SMTP email service has not been configured on this instance.</span>
                    </div>

                    <!-- Username & Email Form -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="username" class="block text-xs font-semibold text-secondary-text mb-1.5">
                                Username
                            </label>
                            <input
                                id="username"
                                ref="usernameinp"
                                v-model="username"
                                type="text"
                                required
                                :placeholder="oldUsername"
                                autocomplete="username"
                                :class="[
                                    'w-full bg-[#181818] border rounded-xl px-4 py-2.5 text-sm text-text placeholder-secondary-text/60 focus:outline-none transition',
                                    username && !usernameRegex.test(username)
                                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                        : 'border-[#383838] focus:border-brand focus:ring-1 focus:ring-brand'
                                ]"
                            />
                            <!-- Username requirements disclosure -->
                            <div class="mt-2">
                                <Disclosure v-slot="{ open }">
                                    <DisclosureButton class="text-xs text-secondary-text hover:text-brand flex items-center gap-1">
                                        <span>Username requirements</span>
                                        <ChevronDownIcon :class="['w-3.5 h-3.5 transition-transform', { 'rotate-180': open }]" />
                                    </DisclosureButton>
                                    <DisclosurePanel class="text-xs text-secondary-text/80 bg-[#1a1a1a] p-2.5 rounded-lg border border-[#333] mt-1.5 leading-relaxed">
                                        Must be 3-16 characters long. Can contain letters, numbers, and underscores.
                                    </DisclosurePanel>
                                </Disclosure>
                            </div>
                        </div>

                        <div>
                            <label for="email" class="block text-xs font-semibold text-secondary-text mb-1.5">
                                Email Address {{ emailerDisabled ? "(Disabled)" : "" }}
                            </label>
                            <input
                                id="email"
                                v-model="email"
                                type="email"
                                :disabled="emailerDisabled"
                                :placeholder="oldEmail"
                                autocomplete="email"
                                :class="[
                                    'w-full bg-[#181818] border border-[#383838] focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-2.5 text-sm text-text placeholder-secondary-text/60 focus:outline-none transition',
                                    { 'opacity-50 cursor-not-allowed': emailerDisabled }
                                ]"
                            />
                        </div>
                    </div>

                    <div class="flex justify-end">
                        <button
                            type="button"
                            :disabled="isInfoSame"
                            @click="updateInfo"
                            class="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Profile Changes
                        </button>
                    </div>

                    <hr class="border-[#333]" />

                    <!-- Password Update Section -->
                    <div>
                        <h3 class="text-lg font-bold text-text mb-1">Change Password</h3>
                        <p class="text-secondary-text text-xs mb-5">
                            Ensure your account is using a long and random password to stay secure.
                        </p>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label for="password" class="block text-xs font-semibold text-secondary-text mb-1.5">
                                    Current Password
                                </label>
                                <input
                                    id="password"
                                    v-model="oldPassword"
                                    type="password"
                                    placeholder="Enter current password"
                                    autocomplete="current-password"
                                    class="w-full bg-[#181818] border border-[#383838] focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-2.5 text-sm text-text placeholder-secondary-text/60 focus:outline-none transition"
                                    @keyup.enter="() => newPasswordEl?.focus()"
                                />
                            </div>

                            <div>
                                <label for="newpassword" class="block text-xs font-semibold text-secondary-text mb-1.5">
                                    New Password
                                </label>
                                <input
                                    id="newpassword"
                                    ref="newPasswordEl"
                                    v-model="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    autocomplete="new-password"
                                    class="w-full bg-[#181818] border border-[#383838] focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-2.5 text-sm text-text placeholder-secondary-text/60 focus:outline-none transition"
                                    @keyup.enter="() => passwordConfirmEl?.focus()"
                                />
                            </div>

                            <div>
                                <label for="confirmpassword" class="block text-xs font-semibold text-secondary-text mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmpassword"
                                    ref="passwordConfirmEl"
                                    v-model="passwordConfirm"
                                    type="password"
                                    placeholder="Repeat new password"
                                    autocomplete="new-password"
                                    class="w-full bg-[#181818] border border-[#383838] focus:border-brand focus:ring-1 focus:ring-brand rounded-xl px-4 py-2.5 text-sm text-text placeholder-secondary-text/60 focus:outline-none transition"
                                    @keyup.enter="() => isPasswordValid ? updatePasswordEl?.click() : null"
                                />
                            </div>
                        </div>

                        <!-- Password requirements disclosure -->
                        <div class="mt-3">
                            <Disclosure v-slot="{ open }">
                                <DisclosureButton class="text-xs text-secondary-text hover:text-brand flex items-center gap-1">
                                    <span>Password requirements</span>
                                    <ChevronDownIcon :class="['w-3.5 h-3.5 transition-transform', { 'rotate-180': open }]" />
                                </DisclosureButton>
                                <DisclosurePanel class="text-xs text-secondary-text/80 bg-[#1a1a1a] p-2.5 rounded-lg border border-[#333] mt-1.5 leading-relaxed max-w-md">
                                    Must be between 8 and 256 characters long, containing uppercase or lowercase letters and special characters or numbers.
                                </DisclosurePanel>
                            </Disclosure>
                        </div>

                        <div class="flex justify-end mt-4">
                            <button
                                ref="updatePasswordEl"
                                type="button"
                                :disabled="!isPasswordValid"
                                @click="updatePassword"
                                class="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    <hr class="border-[#333]" />

                    <!-- Danger Zone Section -->
                    <div class="bg-red-950/20 border border-red-900/40 rounded-xl p-6 flex flex-col gap-6">
                        <div>
                            <h3 class="text-lg font-bold text-red-400 mb-1">Danger Zone</h3>
                            <p class="text-secondary-text text-xs">
                                Irreversible and destructive account operations.
                            </p>
                        </div>

                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-900/30">
                            <div>
                                <p class="text-sm font-bold text-text">Logout Everywhere</p>
                                <p class="text-xs text-secondary-text">Terminates active sessions on all devices including this browser.</p>
                            </div>
                            <button
                                type="button"
                                @click="logoutEverywhere"
                                class="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-700/50 text-xs font-bold transition flex-shrink-0"
                            >
                                Logout All Sessions
                            </button>
                        </div>

                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p class="text-sm font-bold text-text">Delete Account</p>
                                <p class="text-xs text-secondary-text">
                                    {{ owner ? "The owner account cannot be deleted." : "Permanently removes your account and schedules all hosted media for deletion." }}
                                </p>
                            </div>
                            <button
                                type="button"
                                :disabled="owner"
                                @click="modals.deleteAccount = true"
                                class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
                <!-- Section 2: Privacy Settings Card -->
                <div
                    id="privacy"
                    ref="privacydiv"
                    class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6 mb-8 scroll-mt-28"
                >
                    <div class="border-b border-[#383838] pb-4">
                        <h2 class="text-xl font-bold text-text flex items-center gap-2.5 mb-1">
                            <ShieldCheckIcon class="w-5 h-5 text-brand" />
                            <span>Security & Privacy</span>
                        </h2>
                        <p class="text-secondary-text text-xs sm:text-sm">
                            Manage your telemetry and privacy choices on this Folderr instance.
                        </p>
                    </div>

                    <div class="bg-[#181818] border border-[#333] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div class="flex items-start sm:items-center gap-3.5">
                            <input
                                id="dataCollection"
                                v-model="datacollection"
                                type="checkbox"
                                class="mt-0.5 sm:mt-0 w-4 h-4 text-brand bg-tertiary-bg border-[#444] rounded focus:ring-brand focus:ring-offset-bg cursor-pointer"
                            />
                            <div>
                                <label for="dataCollection" class="text-sm font-semibold text-text cursor-pointer">
                                    Collect & share anonymous telemetry
                                </label>
                                <p class="text-xs text-secondary-text">
                                    Help improve this instance by sharing anonymous non-sensitive telemetry.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            @click="updatePrivacy"
                            class="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition whitespace-nowrap self-end sm:self-auto"
                        >
                            Save Privacy Choices
                        </button>
                    </div>
                </div>

                <!-- Section 3: Token Management Card -->
                <div
                    id="tokens"
                    ref="tokendiv"
                    class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6 mb-8 scroll-mt-28"
                >
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#383838] pb-4">
                        <div>
                            <div class="flex items-center gap-2.5 mb-1">
                                <KeyIcon class="w-5 h-5 text-brand" />
                                <h2 class="text-xl font-bold text-text">API Token Management</h2>
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2a2a2a] text-secondary-text border border-[#3a3a3a]">
                                    {{ tokens.length }} / 10
                                </span>
                            </div>
                            <p class="text-secondary-text text-xs sm:text-sm">
                                Create, view, and revoke API tokens for external uploaders like ShareX.
                            </p>
                        </div>

                        <button
                            type="button"
                            @click="tokenCreateModal"
                            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition self-start sm:self-auto"
                        >
                            <PlusIcon class="w-4 h-4" />
                            <span>Generate Token</span>
                        </button>
                    </div>

                    <!-- Empty State -->
                    <div
                        v-if="tokens.length === 0"
                        class="text-center py-12 px-4 bg-[#181818]/60 border border-[#2e2e2e] rounded-xl flex flex-col items-center justify-center"
                    >
                        <div class="w-12 h-12 rounded-xl bg-tertiary-bg flex items-center justify-center text-secondary-text mb-3 border border-[#333]">
                            <KeyIcon class="w-6 h-6" />
                        </div>
                        <h3 class="text-sm font-bold text-text mb-1">No API tokens found</h3>
                        <p class="text-xs text-secondary-text max-w-sm mb-4">
                            You have not created any API tokens yet. Generate one to configure ShareX or upload scripts.
                        </p>
                        <button
                            type="button"
                            @click="tokenCreateModal"
                            class="px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#333] border border-[#444] text-xs font-semibold text-text transition"
                        >
                            Create your first token
                        </button>
                    </div>

                    <!-- Token List -->
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            v-for="token in tokens"
                            :key="token.created"
                            class="bg-[#181818] border border-[#333] hover:border-[#444] rounded-xl p-4 flex flex-col justify-between transition group shadow"
                        >
                            <div>
                                <div class="flex items-center justify-between gap-2 mb-2">
                                    <span class="font-mono text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded">
                                        {{ token.id }}
                                    </span>
                                    <button
                                        type="button"
                                        title="Revoke Token"
                                        @click="revokeToken(token.id)"
                                        class="p-1.5 rounded-lg text-secondary-text hover:text-red-400 hover:bg-red-500/10 transition"
                                    >
                                        <TrashIcon class="w-4 h-4" aria-hidden="true" />
                                    </button>
                                </div>
                                <p class="text-sm font-semibold text-text mb-1 break-words">
                                    {{ token.description || "No description provided" }}
                                </p>
                            </div>
                            <div class="mt-4 pt-3 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-secondary-text">
                                <span>Created:</span>
                                <span>{{ new Date(token.created).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <FFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue';
import {
    ExclamationIcon,
    ClipboardCopyIcon,
    ClipboardCheckIcon,
    ChevronDownIcon,
    TrashIcon,
    DocumentDownloadIcon,
    CogIcon,
    PhotographIcon,
    UserIcon,
    ShieldCheckIcon,
    KeyIcon,
    PlusIcon,
} from "@heroicons/vue/solid";
import {Disclosure, DisclosureButton, DisclosurePanel} from "@headlessui/vue";
import {useRouter} from 'vue-router';
import {useUserStore} from '../../stores/user.js';
import {useTokens} from '../../stores/tokens.js';
import * as api from '../../wrappers/api.js';
import {passwordRegex, usernameRegex} from '../../utils/regexs.js'
import SuccessesErrors from "../../components/Success-N-Error.vue"; // Success & Error component
import Spinner from "../../components/Spinner.vue"
const sne = ref();

const url = computed(() => window.location.origin);

// Router & store
const router = useRouter();
const userStore = useUserStore();
const tokenStore = useTokens();

// Element references

const newPasswordEl = ref<HTMLInputElement>();
const passwordConfirmEl = ref<HTMLInputElement>();
const updatePasswordEl = ref<HTMLButtonElement>();

// User information & loading info
const loading = ref(true);
const username = ref('');
const oldUsername = ref('');
const email = ref('');
const oldEmail = ref('');
const admin = ref(false);

const emailerDisabled = ref(false);

const isInfoSame = computed(() => {
    let usernameSame = true;
    let emailSame = true;
    if (username.value !== oldUsername.value && usernameRegex.test(username.value)) {
        usernameSame = false;
    }

    if (email.value !== oldEmail.value && email.value.length >= 4) {
        emailSame = false;
    }

    return usernameSame && emailSame;
})

type UpdateInfo = {
    email: string;
    username?: string;
} | {
    username: string;
    email?: string;
} | {
    username: string;
    email: string;
}

// Section refs and inner nav tracking
const accountSection = ref<HTMLDivElement>();
const privacydiv = ref<HTMLDivElement>();
const tokendiv = ref<HTMLDivElement>();
const top = ref<HTMLDivElement>();
const usernameinp = ref<HTMLInputElement>();
const activeSection = ref('account');

const scrollToSection = (section: string) => {
    activeSection.value = section;
    let targetEl: HTMLElement | undefined | null;
    if (section === 'account') {
        targetEl = accountSection.value;
    } else if (section === 'privacy') {
        targetEl = privacydiv.value;
    } else if (section === 'tokens') {
        targetEl = tokendiv.value;
    }
    if (targetEl) {
        const topOffset = targetEl.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
};

const updateInfo = async() => {
    if (isInfoSame.value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('You need to update either your email or your username!');
        return;
    }

    // @ts-expect-error, Can't assign type to empty object, but I will.
    const info: UpdateInfo = {};
    if (username.value !== oldUsername.value) {
        info.username = username.value;
    }

    if (email.value !== oldEmail.value) {
        info.email = email.value;
    }

    try {
        const updated = await api.updateInfo(info);

        if (updated.success) {
            oldEmail.value = email.value;
            oldUsername.value = username.value;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addSuccess('Information Updated!');
            userStore.$patch({
                email: info.email ?? userStore.email,
                username: info.username ?? userStore.username,
            });
        } else {
            if (
                typeof updated.error === 'string' &&
                updated.error.startsWith('Emailer not configured')
            ) {
                email.value = oldEmail.value;
                emailerDisabled.value = true;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(
                typeof updated.error === 'string' ?
                updated.error :
                updated.error.message
            );
        }
    } catch (error) {
        if (typeof error === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error);
            return;
        }

        if (error instanceof Error) {
            console.log(error);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error.message);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('Unknown Error Occured while updating your info');
        console.log(error);
        console.log(typeof error);

    }
}

// Password related stuff

const password = ref('');
const passwordConfirm = ref('');
const oldPassword = ref('');

const isPasswordValid = computed(() => {
    let currentInvalid = true;
    let newInvalid = true;
    let match = false;
    const currentLength = oldPassword.value.length || 0;
    const newLength = password.value.length || 0;
    if (currentLength >= 8 && currentLength <= 256) {
        currentInvalid = false;
    }

    if (newLength >= 8 && newLength <= 256 && passwordRegex.test(password.value)) {
        newInvalid = false;
    }

    if (password.value === passwordConfirm.value) {
        match = true;
    }

    return !currentInvalid && !newInvalid && match
})

const passwordValid = computed(() => {
    if (passwordRegex.test(password.value)) {
        return true;
    }

    return false;
})

const oldPasswordValid = computed(() => {
    if (passwordRegex.test(oldPassword.value)) {
        return true;
    }

    return false;
})

const confirmPasswordValid = computed(() => {
    if (passwordConfirm.value === password.value && passwordRegex.test(passwordConfirm.value)) {
        return true;
    }

    return false;
})

const updatePassword = async() =>  {
    if (!isPasswordValid.value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('Password invalid!');
        return;
    }

    try {
        const updated = await api.updatePassword({
            password: oldPassword.value,
            newPassword: password.value
        });

        if (updated.success) {
            oldPassword.value = password.value;
            password.value = '';
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addSuccess('Information Updated!');
        } else {
            if (
                typeof updated.error === 'string' &&
                updated.error.startsWith('Emailer not configured')
            ) {
                email.value = oldEmail.value;
                emailerDisabled.value = true;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(
                typeof updated.error === 'string' ?
                updated.error :
                updated.error.message
            );
        }
    } catch (error) {
        if (typeof error === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error);
            return;
        }

        if (error instanceof Error) {
            console.log(error);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error.message);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('Unknown Error Occured while updating your password');
        console.log(error);
        console.log(typeof error);

    }
}

// Privacy Stuff

const datacollection = ref<boolean>();

const updatePrivacy = async() => {
    const privacy = await api.updatePrivacy({dataCollection: datacollection.value ?? false});

    if (privacy.success) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addSuccess('Updated your privacy settings');
        userStore.$patch({
            privacy: {
                dataCollection: datacollection.value,
            },
        });
        return;
    }

    if (privacy.error instanceof Error) {
        if (import.meta.env.DEV && privacy.response) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(privacy.error.message);
            console.log('Debug Response from API/Logout (everywhere)');
            console.log(privacy.response);
        }

        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addError(privacy.error);

    if (import.meta.env.DEV && privacy.response) {
        console.log('Debug Response from API/Logout (everywhere)');
        console.log(privacy.response);
    }
}

// Account related stuff
const logoutEverywhere = async() => {
    const logout = await api.logoutEverywhere();

    if (logout.success) {
        userStore.clear();
        return router.push('/');
    }

    if (logout.error instanceof Error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError(logout.error.message);
        if (import.meta.env.DEV && logout.response) {
            console.log('Debug Response from API/Logout (everywhere)');
            console.log(logout.response);
        }

        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addError(logout.error);

    if (import.meta.env.DEV && logout.response) {
        console.log('Debug Response from API/Logout (everywhere)');
        console.log(logout.response);
    }
}

const owner = ref(false);
// Init modals
const modals = reactive({
    deleteAccount: false,
    tokens: {
        createToken: false,
        showDetails: false
    }
});

const deleteAccount = async(confirmed: boolean) => {
    if (!confirmed || owner.value) {
        return;
    }

    const deleted = await api.deleteAccount();
    if (deleted.success) {
        userStore.clear();
        return router.push('/account/farewell');
    }

    if (!deleted.success) {
        if (deleted.error instanceof Error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(deleted.error.message);
            return;
        }

        if (typeof deleted.error === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(deleted.error);

        }
    }
}

const cancelDeleteAccount = () => {
    modals.deleteAccount = false;
}

const confirmDeleteAccount = async () => {
    modals.deleteAccount = false;
    return deleteAccount(true);
}

// Token related stuff

const tokens = ref<api.Token[]>([]);

const tokenInfo = reactive<{
    token: string;
    description: string;
}>({
    description: '',
    token: ''
});
const tokenCreateModal = () => {
    modals.tokens.createToken = !modals.tokens.createToken;
}

const createToken = async(description: string) => {
    if (!description || typeof description !== 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('Description needed for the token');
        tokenCreateModal();
        return;
    }

    const apitoken = await api.createToken(description);
    if (apitoken.error) {
        tokenCreateModal();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError(
            `Token creation failed. Error: ${
                apitoken.error instanceof Error ?
                apitoken.error.message :
                apitoken.error
            }`
        );
        return;
    }

    if (apitoken.success && apitoken.output) {
        tokenInfo.token = apitoken.output;
        tokenInfo.description = description;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addSuccess('Token Generated');
        await tokenStore.loadTokens();
        if (tokenStore.tokens) {
            tokens.value = tokenStore.tokens
        }

        tokenCreateModal();
        modals.tokens.showDetails = true;

    }
}

const revokeToken = async(id: string) => {
    const apitoken = await api.revokeToken(id);
    if (apitoken.error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError(
            `Token revokation failed. Error: ${
                apitoken.error instanceof Error ?
                apitoken.error.message :
                apitoken.error
            }`
        );
        return;
    }

    if (apitoken.success) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addSuccess('Token Revoked');
        tokens.value = tokens.value.filter((token) => token.id !== id);
        tokenStore.setTokens(tokens.value);

    }
}

// Instance methods

const copied = ref(false);

const copy = async(text: string) => {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addSuccess("Copied");
}

const scrollToTop = () => {
    if (top.value) {
        top.value.scrollIntoView({behavior: 'smooth'});
        if (usernameinp.value) {
            usernameinp.value.focus();
        }
    }
}

const downloadSharexConfig = () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const config = JSON.stringify({
       Version: '14.0.1',
       Name: `${url.value.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')} Image Host`,
       DestinationType: 'ImageUploader, TextUploader, FileUploader',
       RequestMethod: 'POST' ,
       RequestURL: `${url.value}/api/file`,
       Headers: {
        authorization: tokenInfo.token
       },
       Body: 'MultipartFormData',
       FileFormName: 'Image'
    });
    /* eslint-enable @typescript-eslint/naming-convention */
    const bytes = new TextEncoder().encode(config);
    const blob = new Blob([bytes], {
        type: "application/json;charset=utf-8"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${
        url.value.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')
    } Folderr ShareXConfig.sxcu`;
    link.click();
    URL.revokeObjectURL(link.href);
    document.removeChild(link);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addSuccess('Downloading Config!');
}

const copySharexConfig = async () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const config = JSON.stringify({
       Version: '14.0.1',
       Name: `${url.value.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')} Image Host`,
       DestinationType: 'ImageUploader, TextUploader, FileUploader',
       RequestMethod: 'POST' ,
       RequestURL: `${url.value}/api/file`,
       Headers: {
        authorization: tokenInfo.token
       },
       Body: 'MultipartFormData',
       FileFormName: 'Image'
    });
    /* eslint-enable @typescript-eslint/naming-convention */
    await navigator.clipboard.writeText(config);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addSuccess('Copied Config!');
}

// Setup the component

onMounted(async() => {
    if (userStore.username && userStore.id && userStore.email) {
        username.value = userStore.username;
        email.value = userStore.email;
        oldUsername.value = userStore.username;
        oldEmail.value = userStore.email;
        loading.value = false;
        owner.value = userStore.owner
        admin.value = userStore.admin;
        datacollection.value = userStore.privacy.dataCollection
        if (tokenStore.tokens) {
            tokens.value = tokenStore.tokens;
        } else {
            await tokenStore.loadTokens();
            if (tokenStore.tokens) {
                tokens.value = tokenStore.tokens;
            } else {
                tokens.value = [];
            }
        }
    } else {
        await userStore.loadUser();
        if (!userStore.email || !userStore.username) {
            return router.push('/404');
        }

        if (tokenStore.tokens) {
            tokens.value = tokenStore.tokens;
        } else {
            await tokenStore.loadTokens();
            if (tokenStore.tokens) {
                tokens.value = tokenStore.tokens;
            } else {
                tokens.value = [];
            }

            email.value = userStore.email;
            oldEmail.value = userStore.email;
            username.value = userStore.username;
            oldUsername.value = userStore.username;
            owner.value = userStore.owner;
            loading.value = false;
            admin.value = userStore.admin;
            datacollection.value = userStore.privacy.dataCollection;
        }
    }

    window.addEventListener('scroll', () => {
        if (tokendiv.value && privacydiv.value) {
            const scrollPos = window.scrollY + 140;
            if (scrollPos >= tokendiv.value.offsetTop) {
                activeSection.value = 'tokens';
            } else if (scrollPos >= privacydiv.value.offsetTop) {
                activeSection.value = 'privacy';
            } else {
                activeSection.value = 'account';
            }
        }
    });
})
</script>

<style>
.active {
    background-color: #404040;
}
</style>
